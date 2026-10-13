from sqlalchemy.exc import IntegrityError

from app.core.exceptions import ConflictError
from app.db.unit_of_work import UnitOfWork
from app.models.feature import Feature
from app.repositories.feature_repository import FeatureRepository
from app.schemas.catalog_admin import FeatureAdminRead, FeatureCreate, FeatureUpdate


class FeatureNameTakenError(ConflictError):
    code = "CARACTERISTICA_JA_EXISTE"
    default_detail = "Já existe uma característica com este nome."


class FeatureAdminService:
    """Características (#27). São só atributos de busca: excluir tira de todos os recursos."""

    def __init__(self, features: FeatureRepository, uow: UnitOfWork) -> None:
        self._features = features
        self._uow = uow

    def list_all(self) -> list[FeatureAdminRead]:
        return [
            self._read(feature, total)
            for feature, total in self._features.list_with_resource_counts()
        ]

    def create(self, data: FeatureCreate) -> FeatureAdminRead:
        if self._features.name_taken(data.nome):
            raise FeatureNameTakenError
        feature = Feature(nome=data.nome)
        self._save(feature)
        return self._read(feature, 0)

    def update(self, feature_id: int, data: FeatureUpdate) -> FeatureAdminRead:
        feature = self._features.get_or_raise(feature_id)
        if self._features.name_taken(data.nome, except_id=feature.id):
            raise FeatureNameTakenError
        feature.nome = data.nome
        self._save(feature)
        return self._read(feature, self._features.count_resources(feature.id))

    def remove(self, feature_id: int) -> None:
        feature = self._features.get_or_raise(feature_id)
        self._features.delete_detaching(feature)
        self._uow.commit()

    def _save(self, feature: Feature) -> None:
        try:
            with self._uow.savepoint():
                self._features.add(feature)
        except IntegrityError as exc:
            raise FeatureNameTakenError from exc
        self._uow.commit()

    @staticmethod
    def _read(feature: Feature, total: int) -> FeatureAdminRead:
        return FeatureAdminRead(id=feature.id, nome=feature.nome, total_recursos=total)
