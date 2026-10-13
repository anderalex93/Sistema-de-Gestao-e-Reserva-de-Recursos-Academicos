from collections.abc import Sequence

from app.core.clock import Clock
from app.core.exceptions import BusinessRuleError
from app.models.building import Building
from app.models.feature import Feature
from app.models.resource import Resource
from app.repositories.base import PageResult
from app.repositories.building_repository import BuildingRepository
from app.repositories.feature_repository import FeatureRepository
from app.repositories.resource_filters import ResourceFilters, TimeRange
from app.repositories.resource_repository import ResourceRepository
from app.schemas.catalog import ResourceSearchParams


class IntervalInThePastError(BusinessRuleError):
    code = "INTERVALO_NO_PASSADO"
    default_detail = "Escolha um horário que ainda não começou."


class CatalogService:
    """Consulta do catálogo por quem vai reservar: só o que está ativo."""

    def __init__(
        self,
        buildings: BuildingRepository,
        features: FeatureRepository,
        resources: ResourceRepository,
        clock: Clock,
    ) -> None:
        self._buildings = buildings
        self._features = features
        self._resources = resources
        self._clock = clock

    def list_buildings(self) -> Sequence[Building]:
        return self._buildings.list_active()

    def list_features(self) -> Sequence[Feature]:
        return self._features.list_all()

    def search_resources(self, params: ResourceSearchParams) -> PageResult[Resource]:
        return self._resources.search(self._filters(params), params.page, params.per_page)

    def get_resource(self, resource_id: int) -> Resource:
        return self._resources.get_active_or_raise(resource_id)

    def _filters(self, params: ResourceSearchParams) -> ResourceFilters:
        window = None
        if params.inicio is not None and params.fim is not None:
            if params.inicio < self._clock.now():
                raise IntervalInThePastError
            window = TimeRange(params.inicio, params.fim)
        busca = params.busca.strip() if params.busca else None
        return ResourceFilters(
            bloco_id=params.bloco_id,
            tipo=params.tipo,
            caracteristica_ids=frozenset(params.caracteristicas),
            capacidade_min=params.capacidade_min,
            busca=busca or None,
            livre_em=window,
        )
