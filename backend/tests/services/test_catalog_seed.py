import pytest
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.enums import ResourceType
from app.db import catalog_seed_data as data
from app.db.unit_of_work import UnitOfWork
from app.models.resource import Resource
from app.repositories.building_repository import BuildingRepository
from app.repositories.feature_repository import FeatureRepository
from app.repositories.resource_repository import ResourceRepository
from app.services.catalog_seeder import CatalogSeeder


@pytest.fixture
def seeder(db_session: Session) -> CatalogSeeder:
    return CatalogSeeder(
        BuildingRepository(db_session),
        FeatureRepository(db_session),
        ResourceRepository(db_session),
        UnitOfWork(db_session),
    )


def _run(seeder: CatalogSeeder) -> tuple[int, int, int]:
    result = seeder.run(data.FEATURES, data.BUILDINGS, data.RESOURCES)
    return result.blocos, result.caracteristicas, result.recursos


def test_seeds_the_whole_campus(seeder: CatalogSeeder, db_session: Session) -> None:
    assert _run(seeder) == (4, 10, 34)

    by_type = dict(
        db_session.execute(select(Resource.tipo, func.count()).group_by(Resource.tipo)).all()
    )
    assert by_type == {
        ResourceType.SALA_ESTUDO: 20,
        ResourceType.LABORATORIO: 5,
        ResourceType.AUDITORIO: 1,
        ResourceType.EQUIPAMENTO: 8,
    }


def test_is_idempotent(seeder: CatalogSeeder) -> None:
    _run(seeder)

    assert _run(seeder) == (0, 0, 0)


def test_keeps_admin_changes(seeder: CatalogSeeder, db_session: Session) -> None:
    _run(seeder)
    auditorium = db_session.scalars(
        select(Resource).where(Resource.nome == "Auditório Central")
    ).one()
    auditorium.capacidade = 150

    _run(seeder)

    assert auditorium.capacidade == 150


def test_every_seed_reference_exists() -> None:
    buildings = {building.nome for building in data.BUILDINGS}
    for resource in data.RESOURCES:
        assert resource.bloco in buildings
        assert set(resource.caracteristicas) <= set(data.FEATURES)
        assert (resource.capacidade is None) == (resource.tipo is ResourceType.EQUIPAMENTO)
