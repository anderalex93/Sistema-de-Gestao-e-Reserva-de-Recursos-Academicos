from datetime import time, timedelta

from sqlalchemy.exc import IntegrityError

from app.core.campus_schedule import CampusSchedule
from app.core.clock import Clock
from app.core.enums import ReservationScope, ReservationStatus, UserRole
from app.core.exceptions import BusinessRuleError, ConflictError, ForbiddenError, NotFoundError
from app.core.reservation_codes import CodeGenerator
from app.core.reservation_rules import ReservationRules, duration_label
from app.db.unit_of_work import UnitOfWork
from app.models.reservation import Reservation
from app.models.user import User
from app.repositories.agenda_filters import AgendaFilters
from app.repositories.base import PageResult
from app.repositories.reservation_repository import ReservationRepository
from app.repositories.resource_filters import TimeRange
from app.repositories.resource_repository import ResourceRepository
from app.schemas.pagination import Page
from app.schemas.reservation import (
    AdminAgendaParams,
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
    default_detail = (
        "Só quem fez a reserva pode cancelá-la aqui. A administração cancela pela agenda, "
        "informando o motivo."
    )


class ReservationAlreadyEndedError(BusinessRuleError):
    code = "RESERVA_ENCERRADA"
    default_detail = "Esta reserva já terminou e não pode mais ser cancelada."


class DurationExceededError(BusinessRuleError):
    code = "DURACAO_EXCEDIDA"


class TooFarAheadError(BusinessRuleError):
    code = "ANTECEDENCIA_EXCEDIDA"


class ActiveLimitReachedError(BusinessRuleError):
    code = "LIMITE_RESERVAS_ATIVAS"


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
        rules: ReservationRules,
    ) -> None:
        self._resources = resources
        self._reservations = reservations
        self._uow = uow
        self._schedule = schedule
        self._clock = clock
        self._codes = codes
        self._rules = rules

    def create(self, data: ReservationCreate, user: User) -> Reservation:
        """RF03. A exclusion constraint é a garantia real contra duas reservas simultâneas;
        a consulta prévia só dá a resposta rápida no caso comum."""
        resource = self._resources.get_active_or_raise(data.recurso_id)
        self._validate(data, resource.capacidade)
        self._enforce_usage_rules(data, user)
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

        O dono cancela até 30 minutos antes (relógio do servidor); o admin, as próprias, a
        qualquer momento. Reserva de outra pessoa só pela agenda (`cancel_by_admin`), com motivo.
        """
        reservation = self._reservations.get(reservation_id)
        if reservation is None:
            raise ReservationNotFoundError
        is_admin = user.perfil is UserRole.ADMIN
        if reservation.usuario_id != user.id:
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

    def agenda(self, params: AdminAgendaParams) -> PageResult[Reservation]:
        """Todas as reservas que tocam o dia (fuso do campus), de qualquer pessoa."""
        day = params.data or self._schedule.local_date(self._clock.now())
        window = TimeRange(
            self._schedule.at(day, time.min), self._schedule.at(day + timedelta(days=1), time.min)
        )
        filters = AgendaFilters(
            bloco_id=params.bloco_id, recurso_id=params.recurso_id, status=params.status
        )
        return self._reservations.agenda(window, filters, params.page, params.per_page)

    def cancel_by_admin(self, reservation_id: int, admin: User, motivo: str) -> Reservation:
        """#30. Sem o prazo de 30 minutos (manutenção, evento institucional), mas só enquanto a
        reserva não terminou. O motivo aparece para o dono no histórico."""
        reservation = self._reservations.get(reservation_id)
        if reservation is None:
            raise ReservationNotFoundError
        if reservation.status is ReservationStatus.CANCELADA:
            raise AlreadyCancelledError
        now = self._clock.now()
        if reservation.fim <= now:
            raise ReservationAlreadyEndedError
        reservation.status = ReservationStatus.CANCELADA
        reservation.cancelada_em = now
        reservation.cancelada_por_id = admin.id
        reservation.motivo_cancelamento = motivo
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

    def _enforce_usage_rules(self, data: ReservationCreate, user: User) -> None:
        """#28: duração máxima, antecedência máxima e limite de reservas ativas por perfil."""
        rules = self._rules
        if data.fim - data.inicio > rules.max_duration:
            msg = f"Cada reserva pode ter no máximo {duration_label(rules.max_duration)}."
            raise DurationExceededError(msg)
        today = self._schedule.local_date(self._clock.now())
        if (self._schedule.local_date(data.inicio) - today).days > rules.max_days_ahead:
            msg = f"Reservas podem ser feitas com até {rules.max_days_ahead} dias de antecedência."
            raise TooFarAheadError(msg)
        limit = rules.active_limit_for(user.perfil)
        if limit is not None:
            active = self._reservations.count_active_for_user(user.id, self._clock.now())
            if active >= limit:
                msg = (
                    f"Você já tem {active} reservas ativas, o limite do seu perfil. "
                    "Cancele uma ou espere uma delas acontecer para reservar de novo."
                )
                raise ActiveLimitReachedError(msg)

    def _validate(self, data: ReservationCreate, capacity: int | None) -> None:
        if data.inicio < self._clock.now():
            raise IntervalInThePastError
        if not (self._schedule.is_aligned(data.inicio) and self._schedule.is_aligned(data.fim)):
            raise MisalignedIntervalError
        if not self._schedule.within_opening_hours(data.inicio, data.fim):
            raise OutsideOpeningHoursError
        if capacity is not None and data.qtd_participantes and data.qtd_participantes > capacity:
            raise CapacityExceededError
