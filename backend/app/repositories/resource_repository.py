from collections.abc import Sequence

from sqlalchemy import Exists, Select, case, exists, func, select
from sqlalchemy.orm import contains_eager

from app.core.enums import ResourceType
from app.core.exceptions import NotFoundError
from app.models.building import Building
from app.models.reservation import Reservation
from app.models.resource import Resource, resource_feature
from app.repositories.base import BaseRepository, PageResult
from app.repositories.overlap import overlaps_confirmed
from app.repositories.resource_filters import ResourceFilters, TimeRange

# Espaços primeiro, equipamentos por último: a ordem de declaração do enum.
TYPE_ORDER = case({tipo: index for index, tipo in enumerate(ResourceType)}, value=Resource.tipo)


class ResourceRepository(BaseRepository[Resource]):
    model = Resource
    not_found_message = "Recurso não encontrado."

    def search(self, filters: ResourceFilters, page: int, per_page: int) -> PageResult[Resource]:
        """Recursos reserváveis (ativos, em bloco ativo) que atendem a todos os filtros.

        Uma única consulta: características e horário livre entram como subconsultas,
        sem carregar reservas para a aplicação.
        """
        return self.paginate(_apply(_active_resources(), filters), page, per_page)

    def list_matching(self, filters: ResourceFilters) -> Sequence[Resource]:
        """Todos os recursos reserváveis que atendem aos filtros, na ordem da busca."""
        return self._session.scalars(_apply(_active_resources(), filters)).all()

    def get_active_or_raise(self, resource_id: int) -> Resource:
        resource = self.get(resource_id)
        if resource is None or not resource.ativo or not resource.bloco.ativo:
            raise NotFoundError(self.not_found_message)
        return resource

    def get_by_checkin_token(self, token: str) -> Resource | None:
        return self._session.scalar(select(Resource).where(Resource.checkin_token == token))

    def search_all(
        self, filters: ResourceFilters, ativo: bool | None, page: int, per_page: int
    ) -> PageResult[Resource]:
        """Visão da administração: ativos e inativos, inclusive em bloco desativado."""
        statement = (
            select(Resource)
            .join(Resource.bloco)
            .options(contains_eager(Resource.bloco))
            .order_by(Building.nome, TYPE_ORDER, Resource.nome, Resource.id)
        )
        if ativo is not None:
            statement = statement.where(Resource.ativo.is_(ativo))
        return self.paginate(_apply(statement, filters), page, per_page)

    def name_taken(self, bloco_id: int, nome: str, *, except_id: int | None = None) -> bool:
        """Nome único por bloco, sem diferenciar maiúsculas."""
        statement = select(Resource.id).where(
            Resource.bloco_id == bloco_id, func.lower(Resource.nome) == nome.lower()
        )
        if except_id is not None:
            statement = statement.where(Resource.id != except_id)
        return self._session.scalar(statement.limit(1)) is not None

    def ids_in_building(self, building_id: int) -> Sequence[int]:
        return self._session.scalars(
            select(Resource.id).where(Resource.bloco_id == building_id)
        ).all()

    def existing_keys(self) -> set[tuple[int, str]]:
        """Chaves naturais `(bloco_id, nome)` de todos os recursos, numa consulta."""
        rows = self._session.execute(select(Resource.bloco_id, Resource.nome)).all()
        return {(bloco_id, nome) for bloco_id, nome in rows}


def _active_resources() -> Select[Resource]:
    return (
        select(Resource)
        .join(Resource.bloco)
        .options(contains_eager(Resource.bloco))
        .where(Resource.ativo, Building.ativo)
        .order_by(Building.nome, TYPE_ORDER, Resource.nome, Resource.id)
    )


def _apply(statement: Select[Resource], filters: ResourceFilters) -> Select[Resource]:
    if filters.bloco_id is not None:
        statement = statement.where(Resource.bloco_id == filters.bloco_id)
    if filters.tipo is not None:
        statement = statement.where(Resource.tipo == filters.tipo)
    if filters.capacidade_min is not None:
        statement = statement.where(Resource.capacidade >= filters.capacidade_min)
    if filters.busca:
        statement = statement.where(Resource.nome.icontains(filters.busca, autoescape=True))
    if filters.caracteristica_ids:
        statement = statement.where(
            Resource.id.in_(_having_all_features(filters.caracteristica_ids))
        )
    if filters.livre_em is not None:
        statement = statement.where(~_overlapping_reservation(filters.livre_em))
    return statement


def _having_all_features(feature_ids: frozenset[int]) -> Select[int]:
    return (
        select(resource_feature.c.recurso_id)
        .where(resource_feature.c.caracteristica_id.in_(feature_ids))
        .group_by(resource_feature.c.recurso_id)
        .having(func.count() == len(feature_ids))
    )


def _overlapping_reservation(window: TimeRange) -> Exists:
    return exists().where(
        Reservation.recurso_id == Resource.id,
        overlaps_confirmed(window.inicio, window.fim),
    )
