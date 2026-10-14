from collections.abc import Callable, Iterable
from dataclasses import dataclass
from datetime import datetime, time, timedelta

from app.core.campus_schedule import CampusSchedule
from app.core.clock import Clock
from app.core.enums import CheckinSituation, ReservationStatus
from app.core.exceptions import BusinessRuleError, NotFoundError
from app.core.reservation_rules import ReservationRules
from app.db.unit_of_work import UnitOfWork
from app.models.reservation import Reservation
from app.models.resource import Resource
from app.models.user import User
from app.repositories.reservation_repository import ReservationRepository
from app.repositories.resource_filters import TimeRange
from app.repositories.resource_repository import ResourceRepository
from app.schemas.checkin import CheckinResourceRead, CheckinStatusRead
from app.schemas.reservation import ReservationRead
from app.services.no_show_service import NoShowService
from app.services.reservation_service import ReservationReleasedError


class InvalidQrCodeError(NotFoundError):
    code = "QR_INVALIDO"
    default_detail = (
        "Este QR Code não corresponde a nenhum espaço disponível. Ele pode ter sido substituído: "
        "procure o código atualizado no espaço ou fale com a administração."
    )


class CheckinOutsideWindowError(BusinessRuleError):
    code = "CHECKIN_FORA_DA_JANELA"
    default_detail = "O check-in desta reserva ainda não abriu."


class NoReservationNowError(NotFoundError):
    code = "SEM_RESERVA_AGORA"
    default_detail = "Você não tem reserva neste espaço para agora."


@dataclass(frozen=True, slots=True)
class _Finding:
    situation: CheckinSituation
    reservation: Reservation | None = None
    opens_at: datetime | None = None


class CheckinService:
    """Check-in por QR Code (#43): quem reservou confirma presença lendo o código do espaço.

    A janela vai de `inicio - antecedência` até `inicio + tolerância` (com tolerância zero, até o
    fim da reserva, e o check-in é opcional). Depois do prazo, `NoShowService` libera a reserva.
    """

    def __init__(
        self,
        *,
        resources: ResourceRepository,
        reservations: ReservationRepository,
        no_shows: NoShowService,
        uow: UnitOfWork,
        schedule: CampusSchedule,
        clock: Clock,
        rules: ReservationRules,
    ) -> None:
        self._resources = resources
        self._reservations = reservations
        self._no_shows = no_shows
        self._uow = uow
        self._schedule = schedule
        self._clock = clock
        self._rules = rules

    def status(self, token: str, user: User) -> CheckinStatusRead:
        """O que a pessoa encontra ao ler o QR Code, sem registrar nada."""
        resource = self._resource(token)
        self._no_shows.release_expired()
        finding = self._find(resource, user, lock=False)
        reservation = finding.reservation
        return CheckinStatusRead(
            recurso=CheckinResourceRead.model_validate(resource),
            situacao=finding.situation,
            reserva=ReservationRead.model_validate(reservation) if reservation else None,
            abre_em=finding.opens_at,
        )

    def check_in(self, token: str, user: User) -> Reservation:
        """Registra a presença na reserva dentro da janela. Repetir devolve a mesma reserva."""
        resource = self._resource(token)
        self._no_shows.release_expired()
        finding = self._find(resource, user, lock=True)
        reservation = finding.reservation
        if reservation is None:
            raise NoReservationNowError
        if finding.situation is CheckinSituation.DISPONIVEL:
            reservation.checkin_em = self._clock.now()
            self._uow.commit()
            return reservation
        if finding.situation is CheckinSituation.FEITO:
            return reservation
        if finding.situation is CheckinSituation.LIBERADA:
            raise ReservationReleasedError
        opens_at = self._opens_at(reservation).astimezone(self._schedule.timezone)
        msg = f"Ainda não dá para fazer check-in: a janela desta reserva abre às {opens_at:%H:%M}."
        raise CheckinOutsideWindowError(msg)

    def _resource(self, token: str) -> Resource:
        resource = self._resources.get_by_checkin_token(token)
        if resource is None or not resource.ativo or not resource.bloco.ativo:
            raise InvalidQrCodeError
        return resource

    def _find(self, resource: Resource, user: User, *, lock: bool) -> _Finding:
        """A reserva de hoje (fuso do campus) que importa para quem leu, em ordem de prioridade:
        a que aceita check-in agora, a que já tem check-in e não terminou, a liberada que ainda
        não terminou e a próxima confirmada do dia."""
        now = self._clock.now()
        today = self._schedule.local_date(now)
        window = TimeRange(
            self._schedule.at(today, time.min),
            self._schedule.at(today + timedelta(days=1), time.min),
        )
        reservations = self._reservations.for_user_on_resource(
            user.id, resource.id, window, lock=lock
        )
        confirmed = [r for r in reservations if r.status is ReservationStatus.CONFIRMADA]
        pending = [r for r in confirmed if r.checkin_em is None]

        if found := _first(pending, lambda r: self._opens_at(r) <= now < self._deadline(r)):
            return _Finding(CheckinSituation.DISPONIVEL, found)
        if found := _first(confirmed, lambda r: r.checkin_em is not None and now < r.fim):
            return _Finding(CheckinSituation.FEITO, found)
        released = (r for r in reservations if r.status is ReservationStatus.NAO_COMPARECEU)
        if found := _first(released, lambda r: now < r.fim):
            return _Finding(CheckinSituation.LIBERADA, found)
        if found := _first(pending, lambda r: now < self._opens_at(r)):
            return _Finding(CheckinSituation.CEDO, found, self._opens_at(found))
        return _Finding(CheckinSituation.SEM_RESERVA)

    def _opens_at(self, reservation: Reservation) -> datetime:
        return reservation.inicio - self._rules.checkin_lead

    def _deadline(self, reservation: Reservation) -> datetime:
        """Fim da janela: `inicio + tolerância`, nunca depois do fim. Sem check-in obrigatório,
        dá para registrar presença até a reserva terminar."""
        if not self._rules.checkin_required:
            return reservation.fim
        return min(reservation.inicio + self._rules.checkin_tolerance, reservation.fim)


def _first(
    reservations: Iterable[Reservation], matches: Callable[[Reservation], bool]
) -> Reservation | None:
    return next((reservation for reservation in reservations if matches(reservation)), None)
