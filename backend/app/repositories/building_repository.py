from collections.abc import Sequence

from sqlalchemy import func, select

from app.models.building import Building
from app.models.resource import Resource
from app.repositories.base import BaseRepository


class BuildingRepository(BaseRepository[Building]):
    model = Building
    not_found_message = "Bloco não encontrado."

    def list_active(self) -> Sequence[Building]:
        return self._session.scalars(
            select(Building).where(Building.ativo).order_by(Building.nome)
        ).all()

    def list_with_resource_counts(self) -> Sequence[tuple[Building, int]]:
        """Todos os blocos, ativos primeiro, com quantos recursos cada um tem."""
        total = (
            select(func.count())
            .where(Resource.bloco_id == Building.id)
            .correlate(Building)
            .scalar_subquery()
        )
        rows = self._session.execute(
            select(Building, total).order_by(Building.ativo.desc(), Building.nome)
        ).all()
        return [(building, count) for building, count in rows]

    def get_by_name(self, nome: str) -> Building | None:
        return self._session.scalar(select(Building).where(Building.nome == nome))

    def name_taken(self, nome: str, *, except_id: int | None = None) -> bool:
        """Sem diferenciar maiúsculas: "bloco a" e "Bloco A" são o mesmo bloco."""
        statement = select(Building.id).where(func.lower(Building.nome) == nome.lower())
        if except_id is not None:
            statement = statement.where(Building.id != except_id)
        return self._session.scalar(statement.limit(1)) is not None
