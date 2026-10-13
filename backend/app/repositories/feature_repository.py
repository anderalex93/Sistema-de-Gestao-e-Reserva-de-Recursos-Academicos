from collections.abc import Sequence

from sqlalchemy import select

from app.models.feature import Feature
from app.repositories.base import BaseRepository


class FeatureRepository(BaseRepository[Feature]):
    model = Feature
    not_found_message = "Característica não encontrada."

    def list_all(self) -> Sequence[Feature]:
        return self._session.scalars(select(Feature).order_by(Feature.nome)).all()

    def get_by_name(self, nome: str) -> Feature | None:
        return self._session.scalar(select(Feature).where(Feature.nome == nome))
