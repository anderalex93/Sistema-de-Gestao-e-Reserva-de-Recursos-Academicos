from collections.abc import Sequence

from sqlalchemy import delete, func, select

from app.models.feature import Feature
from app.models.resource import resource_feature
from app.repositories.base import BaseRepository


class FeatureRepository(BaseRepository[Feature]):
    model = Feature
    not_found_message = "Característica não encontrada."

    def list_all(self) -> Sequence[Feature]:
        return self._session.scalars(select(Feature).order_by(Feature.nome)).all()

    def list_with_resource_counts(self) -> Sequence[tuple[Feature, int]]:
        total = (
            select(func.count())
            .where(resource_feature.c.caracteristica_id == Feature.id)
            .correlate(Feature)
            .scalar_subquery()
        )
        rows = self._session.execute(select(Feature, total).order_by(Feature.nome)).all()
        return [(feature, count) for feature, count in rows]

    def count_resources(self, feature_id: int) -> int:
        return (
            self._session.scalar(
                select(func.count()).where(resource_feature.c.caracteristica_id == feature_id)
            )
            or 0
        )

    def get_many(self, feature_ids: Sequence[int]) -> Sequence[Feature]:
        if not feature_ids:
            return []
        return self._session.scalars(
            select(Feature).where(Feature.id.in_(feature_ids)).order_by(Feature.nome)
        ).all()

    def get_by_name(self, nome: str) -> Feature | None:
        return self._session.scalar(select(Feature).where(Feature.nome == nome))

    def name_taken(self, nome: str, *, except_id: int | None = None) -> bool:
        statement = select(Feature.id).where(func.lower(Feature.nome) == nome.lower())
        if except_id is not None:
            statement = statement.where(Feature.id != except_id)
        return self._session.scalar(statement.limit(1)) is not None

    def delete_detaching(self, feature: Feature) -> None:
        """Tira a característica dos recursos que a usam e apaga. Não há histórico a preservar."""
        self._session.execute(
            delete(resource_feature).where(resource_feature.c.caracteristica_id == feature.id)
        )
        self.delete(feature)
        # Coleções `caracteristicas` já carregadas nesta sessão não enxergam o DELETE em massa.
        self._session.expire_all()
