"""Issue #28: cada regra no limite exato e no limite + 1."""

from collections.abc import Callable
from datetime import date, datetime, timedelta

import pytest
from sqlalchemy.orm import Session

from app.core.enums import ReservationStatus, ResourceType, UserRole
from app.core.reservation_codes import RandomCodeGenerator
from app.core.reservation_rules import ReservationRules, duration_label
from app.db.unit_of_work import UnitOfWork
from app.models.building import Building
from app.models.resource import Resource
from app.models.user import User
from app.repositories.reservation_repository import ReservationRepository
from app.repositories.resource_repository import ResourceRepository
from app.schemas.reservation import ReservationCreate
from app.services.reservation_service import (
    ActiveLimitReachedError,
    DurationExceededError,
    ReservationService,
    TooFarAheadError,
)
from tests.conftest import FixedClock
from tests.services.test_reservation_service import NOW, RULES, SCHEDULE, at

# NOW é terça, 22/10/2030, 09:00 em Maceió.
TODAY = date(2030, 10, 22)
TIGHT = ReservationRules(
    max_duration=timedelta(hours=4),
    max_days_ahead=14,
    active_limits={UserRole.ALUNO: 2, UserRole.PROFESSOR: 3, UserRole.ADMIN: None},
)


@pytest.fixture
def rooms(db_session: Session) -> list[Resource]:
    bloco = Building(nome="Bloco A")
    resources = [
        Resource(bloco=bloco, nome=f"Sala {n}", tipo=ResourceType.SALA_ESTUDO, capacidade=4)
        for n in range(1, 6)
    ]
    db_session.add_all(resources)
    db_session.flush()
    return resources


def build(db_session: Session, rules: ReservationRules = RULES) -> ReservationService:
    return ReservationService(
        resources=ResourceRepository(db_session),
        reservations=ReservationRepository(db_session),
        uow=UnitOfWork(db_session),
        schedule=SCHEDULE,
        clock=FixedClock(NOW),
        codes=RandomCodeGenerator(),
        rules=rules,
    )


def request(room: Resource, start: datetime, end: datetime) -> ReservationCreate:
    return ReservationCreate(recurso_id=room.id, inicio=start, fim=end)


def test_duration_up_to_four_hours(
    db_session: Session, rooms: list[Resource], make_user: Callable[..., User]
) -> None:
    lucas = make_user()
    service = build(db_session)

    assert service.create(request(rooms[0], at(14), at(18)), lucas)
    with pytest.raises(DurationExceededError, match="no máximo 4h"):
        service.create(request(rooms[1], at(14), at(18, 30)), lucas)


def test_advance_up_to_fourteen_days(
    db_session: Session, rooms: list[Resource], make_user: Callable[..., User]
) -> None:
    lucas = make_user()
    service = build(db_session)
    day_14, day_15 = TODAY + timedelta(days=14), TODAY + timedelta(days=15)

    assert service.create(request(rooms[0], at(9, day=day_14), at(10, day=day_14)), lucas)
    with pytest.raises(TooFarAheadError, match="14 dias"):
        service.create(request(rooms[0], at(9, day=day_15), at(10, day=day_15)), lucas)


@pytest.mark.parametrize(("role", "limit"), [(UserRole.ALUNO, 2), (UserRole.PROFESSOR, 3)])
def test_active_reservations_limit_per_role(
    db_session: Session,
    rooms: list[Resource],
    make_user: Callable[..., User],
    role: UserRole,
    limit: int,
) -> None:
    person = make_user(perfil=role)
    service = build(db_session, TIGHT)
    for room in rooms[:limit]:
        service.create(request(room, at(9), at(10)), person)

    with pytest.raises(ActiveLimitReachedError, match=f"já tem {limit} reservas ativas"):
        service.create(request(rooms[limit], at(9), at(10)), person)


def test_admin_has_no_active_limit(
    db_session: Session, rooms: list[Resource], make_user: Callable[..., User]
) -> None:
    admin = make_user(perfil=UserRole.ADMIN)
    service = build(db_session, TIGHT)

    for room in rooms:
        assert service.create(request(room, at(9), at(10)), admin)


def test_cancelled_and_finished_reservations_free_the_quota(
    db_session: Session, rooms: list[Resource], make_user: Callable[..., User]
) -> None:
    lucas = make_user()
    service = build(db_session, TIGHT)
    first = service.create(request(rooms[0], at(9), at(10)), lucas)
    second = service.create(request(rooms[1], at(9), at(10)), lucas)
    first.status = ReservationStatus.CANCELADA
    first.cancelada_em = NOW
    # Terminou antes de "agora": não conta mais.
    second.inicio, second.fim = NOW - timedelta(hours=2), NOW - timedelta(hours=1)
    db_session.flush()

    assert service.create(request(rooms[2], at(9), at(10)), lucas)
    assert service.create(request(rooms[3], at(9), at(10)), lucas)


def test_duration_label() -> None:
    labels = [duration_label(timedelta(minutes=m)) for m in (30, 60, 90, 240)]

    assert labels == ["30 min", "1h", "1h30", "4h"]
