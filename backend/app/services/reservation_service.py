from datetime import timedelta

from sqlalchemy.exc import IntegrityError

from app.core.campus_schedule import CampusSchedule
from app.core.clock import Clock
from app.core.enums import ReservationScope, ReservationStatus, UserRole
from app.core.exceptions import BusinessRuleError, ConflictError, ForbiddenError, NotFoundError
from app.core.reservation_codes import CodeGenerator
from app.db.unit_of_work import UnitOfWork
from app.models.reservation import Reservation
from app.models.user import User
from app.repositories.reservation_repository import ReservationRepository
from app.repositories.resource_repository import ResourceRepository
from app.schemas.pagination import Page
from app.schemas.reservation import (
    MyReservationRead,
    ReceiptRead,
    ReceiptResourceRead,
    ReservationCreate,
    ReservationRead,
)
from app.services.catalog_service import IntervalInThePastError

OVERLAP_CONSTRAINT = "reserva_sem_sobreposicao"
CODE_CONSTRAINT = "uq_reserva_codigo"
CODE_ATTEMPTS = 5
# RF04: o próprio usuário cancela até 30 minutos antes do início.
CANCELLATION_NOTICE = timedelta(minutes=30)


class ReservationConflictError(ConflictError):
    code = "RESERVA_CONFLITO"
    default_detail = (
        "Este horário acabou de ser reservado por outra pessoa. Escolha outro horário na grade."
    )


class MisalignedIntervalError(BusinessRuleError):
    code = "HORARIO_FORA_DA_GRADE"
    default_detail = "Reservas começam e terminam em horários cheios ou meias horas."


class OutsideOpeningHoursError(BusinessRuleError):
    code = "FORA_DO_FUNCIONAMENTO"
    default_detail = "O campus está fechado em parte desse horário. Escolha outro horário."


class CapacityExceededError(BusinessRuleError):
    code = "CAPACIDADE_EXCEDIDA"
    default_detail = "O número de participantes passa da capacidade deste espaço."


class CancellationDeadlineError(BusinessRuleError):
    code = "PRAZO_CANCELAMENTO_EXPIRADO"
    default_detail = "Cancelamentos só até 30 minutos antes do início da reserva."


class AlreadyCancelledError(ConflictError):
    code = "RESERVA_JA_CANCELADA"
    default_detail = "Esta reserva já estava cancelada."


class NotReservationOwnerError(ForbiddenError):
    default_detail = "Só quem fez a reserva pode cancelá-la."


class ReservationNotFoundError(NotFoundError):
    default_detail = "Reserva não encontrada."


class ReceiptNotFoundError(NotFoundError):
    code = "COMPROVANTE_NAO_ENCONTRADO"
    default_detail = "Não encontramos um comprovante com este código. Confira as letras e números."


def _violated_constraint(error: IntegrityError) -> str | None:
    diag = getattr(error.orig, "diag", None)
    name = getattr(diag, "constraint_name", None)
    return name if isinstance(name, str) else None


class ReservationService:
    def __init__(
        self,
        *,
        resources: ResourceRepository,
        reservations: ReservationRepository,
        uow: UnitOfWork,
        schedule: CampusSchedule,
        clock: Clock,
        codes: CodeGenerator,
    ) -> None:
        self._resources = resources
        self._reservations = reservations
        self._uow = uow
        self._schedule = schedule
        self._clock = clock
        self._codes = codes

    def create(self, data: ReservationCreate, user: User) -> Reservation:
        """RF03. A exclusion constraint é a garantia real contra duas reservas simultâneas;
        a consulta prévia só dá a resposta rápida no caso comum."""
        resource = self._resources.get_active_or_raise(data.recurso_id)
        self._validate(data, resource.capacidade)
        if self._reservations.confirmed_overlapping(resource.id, data.inicio, data.fim):
            raise ReservationConflictError

        for _ in range(CODE_ATTEMPTS):
            reservation = Reservation(
                codigo=self._codes.new(),
                recurso=resource,
                usuario_id=user.id,
                inicio=data.inicio,
                fim=data.fim,
                finalidade=data.finalidade,
                qtd_participantes=data.qtd_participantes,
            )
            try:
                with self._uow.savepoint():
                    self._reservations.add(reservation)
            except IntegrityError as exc:
                constraint = _violated_constraint(exc)
                if constraint == OVERLAP_CONSTRAINT:
                    raise ReservationConflictError from exc
                if constraint == CODE_CONSTRAINT:
                    continue
                raise
            self._uow.commit()
            return reservation
        msg = "Não foi possível gerar um código de comprovante único."
        raise RuntimeError(msg)

    def get_for(self, reservation_id: int, user: User) -> Reservation:
        """Só o dono e o admin enxergam a reserva; para os demais ela não existe."""
        reservation = self._reservations.get(reservation_id)
        if reservation is None or (
            reservation.usuario_id != user.id and user.perfil is not UserRole.ADMIN
        ):
            raise ReservationNotFoundError
        return reservation

    def list_mine(
        self, user: User, scope: ReservationScope, page: int, per_page: int
    ) -> Page[MyReservationRead]:
        result = self._reservations.list_for_user(user.id, scope, self._clock.now(), page, per_page)
        return Page[MyReservationRead](
            items=[self.with_permissions(reservation) for reservation in result.items],
            total=result.total,
            page=result.page,
            per_page=result.per_page,
            total_pages=result.total_pages,
        )

    def with_permissions(self, reservation: Reservation) -> MyReservationRead:
        base = ReservationRead.model_validate(reservation)
        return MyReservationRead(**dict(base), pode_cancelar=self.can_cancel(reservation))

    def cancel(self, reservation_id: int, user: User) -> Reservation:
        """RF04. Nada é apagado: a reserva fica CANCELADA e o horário volta a ficar livre.

        O dono cancela até 30 minutos antes (relógio do servidor); o admin, a qualquer momento.
        """
        reservation = self._reservations.get(reservation_id)
        if reservation is None:
            raise ReservationNotFoundError
        is_admin = user.perfil is UserRole.ADMIN
        if reservation.usuario_id != user.id and not is_admin:
            raise NotReservationOwnerError
        if reservation.status is ReservationStatus.CANCELADA:
            raise AlreadyCancelledError
        if not is_admin and not self.can_cancel(reservation):
            raise CancellationDeadlineError
        reservation.status = ReservationStatus.CANCELADA
        reservation.cancelada_em = self._clock.now()
        reservation.cancelada_por_id = user.id
        self._uow.commit()
        return reservation

    def can_cancel(self, reservation: Reservation) -> bool:
        return (
            reservation.status is ReservationStatus.CONFIRMADA
            and self._clock.now() <= reservation.inicio - CANCELLATION_NOTICE
        )

    def receipt(self, codigo: str) -> ReceiptRead:
        """Comprovante público. Quem reservou aparece só pelo primeiro nome."""
        reservation = self._reservations.get_by_code(codigo)
        if reservation is None:
            raise ReceiptNotFoundError
        first_name = reservation.usuario.nome.split(maxsplit=1)[0]
        return ReceiptRead(
            codigo=reservation.codigo,
            status=reservation.status,
            inicio=reservation.inicio,
            fim=reservation.fim,
            recurso=ReceiptResourceRead.model_validate(reservation.recurso),
            responsavel=first_name,
            cancelada_em=reservation.cancelada_em,
        )

    def _validate(self, data: ReservationCreate, capacity: int | None) -> None:
        if data.inicio < self._clock.now():
            raise IntervalInThePastError
        if not (self._schedule.is_aligned(data.inicio) and self._schedule.is_aligned(data.fim)):
            raise MisalignedIntervalError
        if not self._schedule.within_opening_hours(data.inicio, data.fim):
            raise OutsideOpeningHoursError
        if capacity is not None and data.qtd_participantes and data.qtd_participantes > capacity:
            raise CapacityExceededError
