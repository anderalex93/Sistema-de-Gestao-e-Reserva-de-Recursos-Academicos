from collections.abc import Callable
from datetime import datetime, timedelta
from itertools import count

import pytest
from sqlalchemy.orm import Session

from app.core.enums import ReservationScope, ReservationStatus, ResourceType
from app.core.reservation_codes import RandomCodeGenerator
from app.db.unit_of_work import UnitOfWork
from app.models.building import Building
from app.models.reservation import Reservation
from app.models.resource import Resource
from app.models.user import User
from app.repositories.reservation_repository import ReservationRepository
from app.repositories.resource_repository import ResourceRepository
from app.services.reservation_service import ReservationService
from tests.conftest import FixedClock
from tests.services.test_reservation_service import SCHEDULE, at

NOW = at(12)


@pytest.fixture
def room(db_session: Session) -> Resource:
    resource = Resource(
        bloco=Building(nome="Bloco A"), nome="Sala 1", tipo=ResourceType.SALA_ESTUDO, capacidade=4
    )
    db_session.add(resource)
    db_session.flush()
    return resource


@pytest.fixture
def lucas(make_user: Callable[..., User]) -> User:
    return make_user(email="lucas@umj.edu.br")


@pytest.fixture
def add(db_session: Session, room: Resource) -> Callable[..., Reservation]:
    codes = count(1)

    def factory(
        user: User,
        start: datetime,
        hours: int = 1,
        status: ReservationStatus = ReservationStatus.CONFIRMADA,
    ) -> Reservation:
        cancelled = status is ReservationStatus.CANCELADA
        reservation = Reservation(
            codigo=f"EDU-M{next(codes):05d}",
            recurso=room,
            usuario_id=user.id,
            inicio=start,
            fim=start + timedelta(hours=hours),
            status=status,
            cancelada_em=NOW if cancelled else None,
        )
        db_session.add(reservation)
        db_session.flush()
        return reservation

    return factory


def service(db_session: Session, now: datetime = NOW) -> ReservationService:
    return ReservationService(
        resources=ResourceRepository(db_session),
        reservations=ReservationRepository(db_session),
        uow=UnitOfWork(db_session),
        schedule=SCHEDULE,
        clock=FixedClock(now),
        codes=RandomCodeGenerator(),
    )


def codes_of(db_session: Session, user: User, scope: ReservationScope) -> list[str]:
    page = service(db_session).list_mine(user, scope, page=1, per_page=20)
    return [item.codigo for item in page.items]


def test_splits_upcoming_and_history(
    db_session: Session,
    lucas: User,
    add: Callable[..., Reservation],
    make_user: Callable[..., User],
) -> None:
    later = add(lucas, at(19))
    soon = add(lucas, at(14))
    ongoing = add(lucas, at(11, 30))  # termina 12:30: ainda é "próxima"
    past = add(lucas, at(8))
    cancelled = add(lucas, at(20), status=ReservationStatus.CANCELADA)
    other = make_user(email="ana@umj.edu.br")
    add(other, at(16))

    upcoming = codes_of(db_session, lucas, ReservationScope.PROXIMAS)
    history = codes_of(db_session, lucas, ReservationScope.HISTORICO)

    assert upcoming == [ongoing.codigo, soon.codigo, later.codigo]
    assert history == [cancelled.codigo, past.codigo]


@pytest.mark.parametrize(
    ("minutes_before", "allowed"),
    [(31, True), (30, True), (29, False)],
)
def test_can_cancel_up_to_thirty_minutes_before(
    db_session: Session,
    lucas: User,
    add: Callable[..., Reservation],
    minutes_before: int,
    allowed: bool,
) -> None:
    reservation = add(lucas, at(19))
    now = at(19) - timedelta(minutes=minutes_before)

    assert service(db_session, now).can_cancel(reservation) is allowed


def test_cancelled_reservation_cannot_be_cancelled_again(
    db_session: Session, lucas: User, add: Callable[..., Reservation]
) -> None:
    cancelled = add(lucas, at(19), status=ReservationStatus.CANCELADA)

    assert service(db_session).can_cancel(cancelled) is False


def test_page_carries_the_permission(
    db_session: Session, lucas: User, add: Callable[..., Reservation]
) -> None:
    add(lucas, at(19))
    add(lucas, at(12) + timedelta(minutes=20), hours=1)  # 20 min: não pode mais

    page = service(db_session).list_mine(lucas, ReservationScope.PROXIMAS, page=1, per_page=20)

    assert [item.pode_cancelar for item in page.items] == [False, True]
    assert (page.total, page.total_pages) == (2, 1)
