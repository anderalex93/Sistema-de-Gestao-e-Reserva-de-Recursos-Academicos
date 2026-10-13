from collections.abc import Sequence

from app.core.clock import Clock
from app.core.enums import ReservationStatus
from app.core.exceptions import ConflictError
from app.models.reservation import Reservation
from app.models.user import User
from app.repositories.reservation_repository import ReservationRepository


class FutureReservationsError(ConflictError):
    code = "RESERVAS_FUTURAS"
    default_detail = "Há reservas futuras. Confirme para cancelá-las e desativar."


def _count_label(count: int) -> str:
    return "1 reserva futura" if count == 1 else f"{count} reservas futuras"


class FutureReservationCanceller:
    """Cancela reservas confirmadas que ainda não começaram quando o espaço ou a pessoa sai do
    sistema, para não sobrar reserva válida para quem não existe mais. Reservas em andamento ou
    passadas ficam como estão: são histórico."""

    def __init__(self, reservations: ReservationRepository, clock: Clock) -> None:
        self._reservations = reservations
        self._clock = clock

    def release(self, resource_ids: Sequence[int], admin: User, *, force: bool, reason: str) -> int:
        """Recurso ou bloco desativado (ADR 0002). Sem `force`, recusa com 409 dizendo quantas
        reservas seriam canceladas; com `force`, cancela em nome do admin."""
        now = self._clock.now()
        future = self._reservations.confirmed_starting_after(resource_ids, now)
        if future and not force:
            msg = (
                f"Há {_count_label(len(future))}, que seriam canceladas. "
                "Confirme para cancelá-las e desativar."
            )
            raise FutureReservationsError(msg)
        return self._cancel(future, by=admin, reason=reason)

    def release_user(self, user: User, *, by: User, reason: str) -> int:
        """Conta desativada pelo admin ou excluída pelo titular."""
        now = self._clock.now()
        future = self._reservations.confirmed_starting_after_for_user(user.id, now)
        return self._cancel(future, by=by, reason=reason)

    def _cancel(self, reservations: Sequence[Reservation], *, by: User, reason: str) -> int:
        now = self._clock.now()
        for reservation in reservations:
            reservation.status = ReservationStatus.CANCELADA
            reservation.cancelada_em = now
            reservation.cancelada_por_id = by.id
            reservation.motivo_cancelamento = reason
        return len(reservations)
