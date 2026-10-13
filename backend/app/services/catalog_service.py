from collections.abc import Sequence

from app.models.building import Building
from app.models.feature import Feature
from app.models.resource import Resource
from app.repositories.base import PageResult
from app.repositories.building_repository import BuildingRepository
from app.repositories.feature_repository import FeatureRepository
from app.repositories.resource_repository import ResourceRepository


class CatalogService:
    """Consulta do catálogo por quem vai reservar: só o que está ativo."""

    def __init__(
        self,
        buildings: BuildingRepository,
        features: FeatureRepository,
        resources: ResourceRepository,
    ) -> None:
        self._buildings = buildings
        self._features = features
        self._resources = resources

    def list_buildings(self) -> Sequence[Building]:
        return self._buildings.list_active()

    def list_features(self) -> Sequence[Feature]:
        return self._features.list_all()

    def list_resources(self, page: int, per_page: int) -> PageResult[Resource]:
        return self._resources.list_active(page, per_page)

    def get_resource(self, resource_id: int) -> Resource:
        return self._resources.get_active_or_raise(resource_id)
