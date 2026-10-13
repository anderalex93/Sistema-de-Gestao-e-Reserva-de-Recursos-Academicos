from collections.abc import Sequence
from datetime import datetime

from sqlalchemy import exists, func, or_, select
from sqlalchemy.orm import contains_eager, joinedload

from app.core.enums import ReservationScope, ReservationStatus
from app.models.building import Building
from app.models.reservation import Reservation
from app.models.resource import Resource
from app.repositories.agenda_filters import AgendaFilters
from app.repositories.base import BaseRepository, PageResult
from app.repositories.overlap import overlaps_confirmed
from app.repositories.resource_filters import TimeRange


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
                overlaps_confirmed(inicio, fim),
            )
            .order_by(Reservation.inicio)
        ).all()

    def confirmed_for_resources(
        self, resource_ids: Sequence[int], inicio: datetime, fim: datetime
    ) -> Sequence[Reservation]:
        """Reservas confirmadas de vários recursos que tocam `[inicio, fim)`, numa consulta só."""
        if not resource_ids:
            return []
        return self._session.scalars(
            select(Reservation)
            .options(joinedload(Reservation.usuario))
            .where(
                Reservation.recurso_id.in_(resource_ids),
                overlaps_confirmed(inicio, fim),
            )
            .order_by(Reservation.recurso_id, Reservation.inicio)
        ).all()

    def get_by_code(self, codigo: str) -> Reservation | None:
        return self._session.scalar(
            select(Reservation)
            .options(joinedload(Reservation.usuario))
            .where(Reservation.codigo == codigo.strip().upper())
        )

    def list_for_user(
        self, user_id: int, scope: ReservationScope, now: datetime, page: int, per_page: int
    ) -> PageResult[Reservation]:
        """Próximas: confirmadas que ainda não terminaram, da mais cedo para a mais tarde.
        Histórico: canceladas ou já terminadas, da mais recente para a mais antiga."""
        statement = select(Reservation).where(Reservation.usuario_id == user_id)
        if scope is ReservationScope.PROXIMAS:
            statement = statement.where(
                Reservation.status == ReservationStatus.CONFIRMADA, Reservation.fim > now
            ).order_by(Reservation.inicio, Reservation.id)
        else:
            statement = statement.where(
                or_(Reservation.status == ReservationStatus.CANCELADA, Reservation.fim <= now)
            ).order_by(Reservation.inicio.desc(), Reservation.id.desc())
        return self.paginate(statement, page, per_page)

    def count_active_for_user(self, user_id: int, now: datetime) -> int:
        """Reservas que ainda contam no limite: confirmadas e não terminadas."""
        return (
            self._session.scalar(
                select(func.count()).where(
                    Reservation.usuario_id == user_id,
                    Reservation.status == ReservationStatus.CONFIRMADA,
                    Reservation.fim > now,
                )
            )
            or 0
        )

    def exists_for_resources(self, resource_ids: Sequence[int]) -> bool:
        """Se há qualquer reserva (de qualquer status ou data): o histórico que impede apagar."""
        if not resource_ids:
            return False
        return bool(
            self._session.scalar(select(exists().where(Reservation.recurso_id.in_(resource_ids))))
        )

    def confirmed_starting_after(
        self, resource_ids: Sequence[int], moment: datetime
    ) -> Sequence[Reservation]:
        """Reservas confirmadas que ainda não começaram, travadas até o fim da transação."""
        if not resource_ids:
            return []
        return self._session.scalars(
            select(Reservation)
            .where(
                Reservation.recurso_id.in_(resource_ids),
                Reservation.status == ReservationStatus.CONFIRMADA,
                Reservation.inicio > moment,
            )
            .order_by(Reservation.inicio)
            .with_for_update(of=Reservation)
        ).all()

    def confirmed_starting_after_for_user(
        self, user_id: int, moment: datetime
    ) -> Sequence[Reservation]:
        """Reservas confirmadas de uma pessoa que ainda não começaram, travadas na transação."""
        return self._session.scalars(
            select(Reservation)
            .where(
                Reservation.usuario_id == user_id,
                Reservation.status == ReservationStatus.CONFIRMADA,
                Reservation.inicio > moment,
            )
            .order_by(Reservation.inicio)
            .with_for_update(of=Reservation)
        ).all()

    def agenda(
        self, window: TimeRange, filters: AgendaFilters, page: int, per_page: int
    ) -> PageResult[Reservation]:
        """Reservas que tocam a janela, agrupáveis por recurso: bloco, recurso e horário."""
        statement = (
            select(Reservation)
            .join(Reservation.recurso)
            .join(Resource.bloco)
            .options(
                contains_eager(Reservation.recurso).contains_eager(Resource.bloco),
                joinedload(Reservation.usuario),
            )
            .where(Reservation.inicio < window.fim, Reservation.fim > window.inicio)
            .order_by(Building.nome, Resource.nome, Reservation.inicio, Reservation.id)
        )
        if filters.bloco_id is not None:
            statement = statement.where(Resource.bloco_id == filters.bloco_id)
        if filters.recurso_id is not None:
            statement = statement.where(Reservation.recurso_id == filters.recurso_id)
        if filters.status is not None:
            statement = statement.where(Reservation.status == filters.status)
        return self.paginate(statement, page, per_page)

    def all_for_user(self, user_id: int) -> Sequence[Reservation]:
        """Histórico completo de uma pessoa, da mais recente para a mais antiga (exportação)."""
        return self._session.scalars(
            select(Reservation)
            .where(Reservation.usuario_id == user_id)
            .order_by(Reservation.inicio.desc(), Reservation.id.desc())
        ).all()
