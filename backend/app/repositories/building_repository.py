from collections.abc import Sequence

from sqlalchemy import select

from app.models.building import Building
from app.repositories.base import BaseRepository


class BuildingRepository(BaseRepository[Building]):
    model = Building
    not_found_message = "Bloco não encontrado."

    def list_active(self) -> Sequence[Building]:
        return self._session.scalars(
            select(Building).where(Building.ativo).order_by(Building.nome)
        ).all()

    def get_by_name(self, nome: str) -> Building | None:
        return self._session.scalar(select(Building).where(Building.nome == nome))
