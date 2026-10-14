from collections.abc import Sequence
from datetime import datetime

from sqlalchemy import delete, exists, func, or_, select, update
from sqlalchemy.orm import contains_eager, joinedload

from app.core.enums import ReservationScope, ReservationStatus
from app.models.building import Building
from app.models.reservation import Reservation
from app.models.resource import Resource
from app.repositories.agenda_filters import AgendaFilters
from app.repositories.base import BaseRepository, PageResult
from app.repositories.occupancy_rows import ReservationSpan
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
        Histórico: não confirmadas (canceladas ou liberadas por não comparecimento) ou já
        terminadas, da mais recente para a mais antiga."""
        statement = select(Reservation).where(Reservation.usuario_id == user_id)
        if scope is ReservationScope.PROXIMAS:
            statement = statement.where(
                Reservation.status == ReservationStatus.CONFIRMADA, Reservation.fim > now
            ).order_by(Reservation.inicio, Reservation.id)
        else:
            statement = statement.where(
                or_(Reservation.status != ReservationStatus.CONFIRMADA, Reservation.fim <= now)
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

    def release_no_shows(self, started_before: datetime, now: datetime) -> int:
        """#43. Confirmadas sem check-in que começaram até `started_before` viram
        `NAO_COMPARECEU`, num UPDATE só (índice parcial `ix_reserva_inicio_sem_checkin`). Fora
        da exclusion constraint, o horário fica livre. Devolve quantas foram liberadas."""
        released = self._session.scalars(
            update(Reservation)
            .where(
                Reservation.status == ReservationStatus.CONFIRMADA,
                Reservation.checkin_em.is_(None),
                Reservation.inicio <= started_before,
            )
            .values(status=ReservationStatus.NAO_COMPARECEU, liberada_em=now)
            .returning(Reservation.id)
        ).all()
        return len(released)

    def for_user_on_resource(
        self, user_id: int, resource_id: int, window: TimeRange, *, lock: bool = False
    ) -> Sequence[Reservation]:
        """Reservas não canceladas de uma pessoa num recurso que tocam a janela, por início.

        Com `lock`, trava as linhas (e relê o estado atual delas) até o fim da transação, para
        o check-in não disputar com a liberação por não comparecimento.
        """
        statement = (
            select(Reservation)
            .where(
                Reservation.usuario_id == user_id,
                Reservation.recurso_id == resource_id,
                Reservation.status != ReservationStatus.CANCELADA,
                Reservation.inicio < window.fim,
                Reservation.fim > window.inicio,
            )
            .order_by(Reservation.inicio, Reservation.id)
        )
        if lock:
            statement = statement.with_for_update(of=Reservation).execution_options(
                populate_existing=True
            )
        return self._session.scalars(statement).all()

    def spans_touching(
        self, resource_ids: Sequence[int], window: TimeRange
    ) -> list[ReservationSpan]:
        """#44. Reservas de qualquer status dos recursos que tocam a janela, numa consulta só e
        só com as colunas que o painel de ocupação agrega (sem carregar entidades)."""
        if not resource_ids:
            return []
        rows = self._session.execute(
            select(
                Reservation.recurso_id,
                Reservation.inicio,
                Reservation.fim,
                Reservation.status,
                Reservation.checkin_em,
                Reservation.liberada_em,
            ).where(
                Reservation.recurso_id.in_(resource_ids),
                Reservation.inicio < window.fim,
                Reservation.fim > window.inicio,
            )
        )
        return [
            ReservationSpan(recurso_id, inicio, fim, status, checkin_em, liberada_em)
            for recurso_id, inicio, fim, status, checkin_em, liberada_em in rows
        ]

    def delete_by_code_prefix(self, prefix: str) -> int:
        """Apaga de uma vez as reservas cujo código começa com `prefix` (seed de demonstração,
        #38). Devolve quantas foram apagadas."""
        deleted = self._session.scalars(
            delete(Reservation)
            .where(Reservation.codigo.startswith(prefix, autoescape=True))
            .returning(Reservation.id)
            .execution_options(synchronize_session="fetch")
        ).all()
        return len(deleted)

    def all_for_user(self, user_id: int) -> Sequence[Reservation]:
        """Histórico completo de uma pessoa, da mais recente para a mais antiga (exportação)."""
        return self._session.scalars(
            select(Reservation)
            .where(Reservation.usuario_id == user_id)
            .order_by(Reservation.inicio.desc(), Reservation.id.desc())
        ).all()
