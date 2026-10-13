from collections.abc import Sequence

from app.core.clock import Clock
from app.core.enums import ReservationStatus
from app.core.exceptions import ConflictError
from app.models.user import User
from app.repositories.reservation_repository import ReservationRepository


class FutureReservationsError(ConflictError):
    code = "RESERVAS_FUTURAS"
    default_detail = "Há reservas futuras. Confirme para cancelá-las e desativar."


def _count_label(count: int) -> str:
    return "1 reserva futura" if count == 1 else f"{count} reservas futuras"


class FutureReservationCanceller:
    """Desativar um recurso ou bloco não pode deixar reservas confirmadas para um espaço que
    some da busca. Sem confirmação, recusa com 409 dizendo quantas são; com `forcar=true`,
    cancela todas em nome do admin. Reservas em andamento ou passadas ficam como estão."""

    def __init__(self, reservations: ReservationRepository, clock: Clock) -> None:
        self._reservations = reservations
        self._clock = clock

    def release(self, resource_ids: Sequence[int], admin: User, *, force: bool, reason: str) -> int:
        now = self._clock.now()
        future = self._reservations.confirmed_starting_after(resource_ids, now)
        if not future:
            return 0
        if not force:
            msg = (
                f"Há {_count_label(len(future))}, que seriam canceladas. "
                "Confirme para cancelá-las e desativar."
            )
            raise FutureReservationsError(msg)
        for reservation in future:
            reservation.status = ReservationStatus.CANCELADA
            reservation.cancelada_em = now
            reservation.cancelada_por_id = admin.id
            reservation.motivo_cancelamento = reason
        return len(future)
