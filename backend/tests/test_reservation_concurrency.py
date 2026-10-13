"""RNF03 de verdade: duas transações simultâneas, cada uma na sua conexão, com commit.

Fora do esquema de rollback das outras suítes, então cria e apaga os próprios dados.
"""

import threading
from collections.abc import Iterator
from dataclasses import dataclass

import pytest
from sqlalchemy import Engine, delete
from sqlalchemy.orm import Session

from app.core.enums import ResourceType
from app.core.reservation_codes import RandomCodeGenerator
from app.core.security import PasswordHasher
from app.db.unit_of_work import UnitOfWork
from app.models.building import Building
from app.models.reservation import Reservation
from app.models.resource import Resource
from app.models.user import User
from app.repositories.reservation_repository import ReservationRepository
from app.repositories.resource_repository import ResourceRepository
from app.schemas.reservation import ReservationCreate
from app.services.reservation_service import ReservationConflictError, ReservationService
from tests.conftest import FixedClock
from tests.services.test_reservation_service import NOW, RULES, SCHEDULE, at


@dataclass(frozen=True)
class Committed:
    building_id: int
    resource_id: int
    user_ids: tuple[int, int]


@pytest.fixture
def committed(engine: Engine, hasher: PasswordHasher) -> Iterator[Committed]:
    with Session(engine) as session:
        building = Building(nome="Bloco Concorrência")
        resource = Resource(
            bloco=building, nome="Sala disputada", tipo=ResourceType.SALA_ESTUDO, capacidade=4
        )
        users = [
            User(nome=f"Pessoa {n}", email=f"corrida{n}@umj.edu.br", senha_hash=hasher.hash("x1"))
            for n in (1, 2)
        ]
        session.add_all([resource, *users])
        session.commit()
        data = Committed(building.id, resource.id, (users[0].id, users[1].id))
    try:
        yield data
    finally:
        with Session(engine) as session:
            session.execute(delete(Reservation).where(Reservation.recurso_id == data.resource_id))
            session.execute(delete(Resource).where(Resource.id == data.resource_id))
            session.execute(delete(Building).where(Building.id == data.building_id))
            session.execute(delete(User).where(User.id.in_(data.user_ids)))
            session.commit()


def test_two_simultaneous_requests_give_one_reservation_and_one_conflict(
    engine: Engine, committed: Committed
) -> None:
    barrier = threading.Barrier(2)
    outcomes: list[str] = []
    lock = threading.Lock()

    def attempt(user_id: int) -> None:
        with Session(engine) as session:
            service = ReservationService(
                resources=ResourceRepository(session),
                reservations=ReservationRepository(session),
                uow=UnitOfWork(session),
                schedule=SCHEDULE,
                clock=FixedClock(NOW),
                codes=RandomCodeGenerator(),
                rules=RULES,
            )
            user = session.get_one(User, user_id)
            data = ReservationCreate(recurso_id=committed.resource_id, inicio=at(19), fim=at(20))
            barrier.wait(timeout=10)
            try:
                service.create(data, user)
                outcome = "201"
            except ReservationConflictError:
                outcome = "409"
            with lock:
                outcomes.append(outcome)

    threads = [threading.Thread(target=attempt, args=(uid,)) for uid in committed.user_ids]
    for thread in threads:
        thread.start()
    for thread in threads:
        thread.join(timeout=30)

    assert sorted(outcomes) == ["201", "409"]
