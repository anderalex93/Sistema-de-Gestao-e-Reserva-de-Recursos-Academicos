from collections.abc import Sequence
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import joinedload

from app.core.enums import ReservationStatus
from app.models.reservation import Reservation
from app.repositories.base import BaseRepository


class ReservationRepository(BaseRepository[Reservation]):
    model = Reservation
    not_found_message = "Reserva não encontrada."

    def confirmed_overlapping(
        self, resource_id: int, inicio: datetime, fim: datetime
    ) -> Sequence[Reservation]:
        """Reservas confirmadas do recurso que tocam `[inicio, fim)`, com quem reservou."""
        return self._session.scalars(
            select(Reservation)
            .options(joinedload(Reservation.usuario))
            .where(
                Reservation.recurso_id == resource_id,
                Reservation.status == ReservationStatus.CONFIRMADA,
                Reservation.inicio < fim,
                Reservation.fim > inicio,
            )
            .order_by(Reservation.inicio)
        ).all()
