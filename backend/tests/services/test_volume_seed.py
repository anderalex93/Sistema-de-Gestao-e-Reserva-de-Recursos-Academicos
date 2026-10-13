import logging
from random import Random

import pytest
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import Settings
from app.core.enums import ReservationStatus, ResourceType
from app.db.unit_of_work import UnitOfWork
from app.models.building import Building
from app.models.reservation import Reservation
from app.models.resource import Resource
from app.models.user import User
from app.repositories.building_repository import BuildingRepository
from app.repositories.reservation_repository import ReservationRepository
from app.repositories.resource_repository import ResourceRepository
from app.repositories.user_repository import UserRepository
from app.seed import seed_volume
from app.services.volume_seeder import VolumePlan, VolumeSeeder
from tests.conftest import FixedClock
from tests.services.test_reservation_service import NOW, SCHEDULE

PLAN = VolumePlan(recursos=4, usuarios=3, dias=10, reservas_por_dia=(2, 3))


def seeder(db_session: Session) -> VolumeSeeder:
    return VolumeSeeder(
        buildings=BuildingRepository(db_session),
        resources=ResourceRepository(db_session),
        users=UserRepository(db_session),
        reservations=ReservationRepository(db_session),
        uow=UnitOfWork(db_session),
        schedule=SCHEDULE,
        clock=FixedClock(NOW),
        rng=Random(1),  # noqa: S311 - massa de teste reprodutível
    )


def count(db_session: Session, model: type[Reservation | User | Resource]) -> int:
    return db_session.scalar(select(func.count()).select_from(model)) or 0


def test_fills_resources_users_and_non_overlapping_reservations(db_session: Session) -> None:
    db_session.add(
        Resource(
            bloco=Building(nome="Bloco A"),
            nome="Sala 1",
            tipo=ResourceType.SALA_ESTUDO,
            capacidade=4,
        )
    )
    db_session.flush()

    result = seeder(db_session).run(PLAN, "hash-qualquer")

    # Completa até 4 recursos, reaproveitando o que já existe.
    assert (result.recursos, result.usuarios) == (3, 3)
    assert count(db_session, Resource) == 4
    assert count(db_session, Reservation) == result.reservas
    # 10 dias com dois domingos fechados, 4 recursos, 2 a 3 reservas por dia.
    assert 4 * 8 * 2 * 0.8 <= result.reservas <= 4 * 8 * 3
    reservations = db_session.scalars(select(Reservation)).all()
    assert {r.status for r in reservations} == {
        ReservationStatus.CONFIRMADA,
        ReservationStatus.CANCELADA,
    }
    assert any(r.inicio < NOW for r in reservations)
    assert any(r.inicio > NOW for r in reservations)
    assert all(SCHEDULE.within_opening_hours(r.inicio, r.fim) for r in reservations)
    assert all(SCHEDULE.is_aligned(r.inicio) and SCHEDULE.is_aligned(r.fim) for r in reservations)


def test_runs_only_once(db_session: Session) -> None:
    first = seeder(db_session).run(PLAN, "hash-qualquer")

    second = seeder(db_session).run(PLAN, "hash-qualquer")

    assert first.reservas > 0
    assert (second.recursos, second.usuarios, second.reservas) == (0, 0, 0)


def test_creates_a_building_when_there_is_none(db_session: Session) -> None:
    seeder(db_session).run(VolumePlan(recursos=1, usuarios=1, dias=1), "hash-qualquer")

    assert db_session.scalars(select(Building.nome)).all() == ["Bloco Carga"]


def test_volume_script_requires_password(
    settings: Settings, caplog: pytest.LogCaptureFixture
) -> None:
    caplog.set_level(logging.ERROR)

    assert seed_volume(settings.model_copy(update={"seed_volume_password": None})) == 1
    assert "SEED_VOLUME_SENHA" in caplog.text
