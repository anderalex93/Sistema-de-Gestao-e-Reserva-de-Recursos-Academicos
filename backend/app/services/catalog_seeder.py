from collections.abc import Iterable
from dataclasses import dataclass

from app.db.catalog_seed_data import BuildingSeed, ResourceSeed
from app.db.unit_of_work import UnitOfWork
from app.models.building import Building
from app.models.feature import Feature
from app.models.resource import Resource
from app.repositories.building_repository import BuildingRepository
from app.repositories.feature_repository import FeatureRepository
from app.repositories.resource_repository import ResourceRepository


@dataclass(frozen=True, slots=True)
class CatalogSeedResult:
    blocos: int
    caracteristicas: int
    recursos: int


class CatalogSeeder:
    """Cria blocos, características e recursos que ainda não existem.

    Idempotente: procura cada item pela chave natural e nunca altera o que já está no banco,
    para não desfazer ajustes feitos pela administração.
    """

    def __init__(
        self,
        buildings: BuildingRepository,
        features: FeatureRepository,
        resources: ResourceRepository,
        uow: UnitOfWork,
    ) -> None:
        self._buildings = buildings
        self._features = features
        self._resources = resources
        self._uow = uow

    def run(
        self,
        features: Iterable[str],
        buildings: Iterable[BuildingSeed],
        resources: Iterable[ResourceSeed],
    ) -> CatalogSeedResult:
        features_by_name, created_features = self._ensure_features(features)
        buildings_by_name, created_buildings = self._ensure_buildings(buildings)
        created_resources = 0
        for seed in resources:
            building = buildings_by_name[seed.bloco]
            if self._resources.get_by_name(building.id, seed.nome) is not None:
                continue
            self._resources.add(
                Resource(
                    bloco=building,
                    nome=seed.nome,
                    tipo=seed.tipo,
                    capacidade=seed.capacidade,
                    andar=seed.andar,
                    descricao=seed.descricao,
                    caracteristicas=[features_by_name[name] for name in seed.caracteristicas],
                )
            )
            created_resources += 1
        self._uow.commit()
        return CatalogSeedResult(created_buildings, created_features, created_resources)

    def _ensure_features(self, names: Iterable[str]) -> tuple[dict[str, Feature], int]:
        found: dict[str, Feature] = {}
        created = 0
        for name in names:
            feature = self._features.get_by_name(name)
            if feature is None:
                feature = self._features.add(Feature(nome=name))
                created += 1
            found[name] = feature
        return found, created

    def _ensure_buildings(self, seeds: Iterable[BuildingSeed]) -> tuple[dict[str, Building], int]:
        found: dict[str, Building] = {}
        created = 0
        for seed in seeds:
            building = self._buildings.get_by_name(seed.nome)
            if building is None:
                building = self._buildings.add(Building(nome=seed.nome, descricao=seed.descricao))
                created += 1
            found[seed.nome] = building
        return found, created
