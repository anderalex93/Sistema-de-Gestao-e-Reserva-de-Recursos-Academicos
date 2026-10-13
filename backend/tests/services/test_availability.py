from collections.abc import Callable
from datetime import UTC, date, datetime, time
from itertools import count
from zoneinfo import ZoneInfo

import pytest
from sqlalchemy.orm import Session

from app.core.campus_schedule import CampusSchedule
from app.core.enums import ReservationStatus, ResourceType, SlotStatus, UserRole
from app.core.exceptions import NotFoundError
from app.core.opening_hours import DEFAULT_OPENING_HOURS, parse_weekly_hours
from app.models.building import Building
from app.models.reservation import Reservation
from app.models.resource import Resource
from app.models.user import User
from app.repositories.reservation_repository import ReservationRepository
from app.repositories.resource_repository import ResourceRepository
from app.services.availability_service import AvailabilityService
from tests.conftest import FixedClock

MACEIO = ZoneInfo("America/Maceio")
SCHEDULE = CampusSchedule(MACEIO, parse_weekly_hours(DEFAULT_OPENING_HOURS))
WEDNESDAY = date(2030, 10, 23)
SATURDAY = date(2030, 10, 26)
SUNDAY = date(2030, 10, 27)


def local(day: date, hour: int, minute: int = 0) -> datetime:
    return datetime.combine(day, time(hour, minute), tzinfo=MACEIO)


@pytest.fixture
def room(db_session: Session) -> Resource:
    resource = Resource(
        bloco=Building(nome="Bloco A"), nome="Sala 1", tipo=ResourceType.SALA_ESTUDO, capacidade=4
    )
    db_session.add(resource)
    db_session.flush()
    return resource


@pytest.fixture
def owner(make_user: Callable[..., User]) -> User:
    return make_user(email="dono@umj.edu.br", nome="Maria Dona")


@pytest.fixture
def reserve(db_session: Session, room: Resource, owner: User) -> Callable[..., None]:
    codes = count(1)

    def factory(
        inicio: datetime, fim: datetime, status: ReservationStatus = ReservationStatus.CONFIRMADA
    ) -> None:
        cancelled = status is ReservationStatus.CANCELADA
        db_session.add(
            Reservation(
                codigo=f"EDU-D{next(codes):05d}",
                recurso_id=room.id,
                usuario_id=owner.id,
                inicio=inicio,
                fim=fim,
                status=status,
                cancelada_em=inicio if cancelled else None,
            )
        )
        db_session.flush()

    return factory


def service(db_session: Session, now: datetime) -> AvailabilityService:
    return AvailabilityService(
        ResourceRepository(db_session),
        ReservationRepository(db_session),
        SCHEDULE,
        FixedClock(now.astimezone(UTC)),
    )


def grid(
    db_session: Session, room: Resource, viewer: User, day: date, now: datetime
) -> dict[str, tuple[SlotStatus, bool, str | None]]:
    result = service(db_session, now).for_day(room.id, day, viewer)
    return {
        slot.inicio.astimezone(MACEIO).strftime("%H:%M"): (
            slot.status,
            slot.propria,
            slot.reservado_por,
        )
        for slot in result.slots
    }


def test_free_weekday_has_thirty_minute_slots_within_opening_hours(
    db_session: Session, room: Resource, owner: User
) -> None:
    result = service(db_session, local(WEDNESDAY, 6)).for_day(room.id, WEDNESDAY, owner)

    assert len(result.slots) == 26
    first, last = result.slots[0], result.slots[-1]
    assert first.inicio == datetime(2030, 10, 23, 11, 0, tzinfo=UTC)
    assert last.fim == local(WEDNESDAY, 21)
    assert {slot.status for slot in result.slots} == {SlotStatus.LIVRE}


def test_saturday_has_shorter_hours_and_sunday_is_closed(
    db_session: Session, room: Resource, owner: User
) -> None:
    saturday = grid(db_session, room, owner, SATURDAY, local(WEDNESDAY, 6))
    sunday = grid(db_session, room, owner, SUNDAY, local(WEDNESDAY, 6))

    assert (next(iter(saturday)), list(saturday)[-1], len(saturday)) == ("08:00", "11:30", 8)
    assert sunday == {}


def test_reserved_slots_are_busy_without_exposing_the_holder_to_students(
    db_session: Session,
    room: Resource,
    reserve: Callable[..., None],
    make_user: Callable[..., User],
) -> None:
    reserve(local(WEDNESDAY, 19), local(WEDNESDAY, 20))
    reserve(local(WEDNESDAY, 9), local(WEDNESDAY, 10), ReservationStatus.CANCELADA)
    student = make_user(email="outro@umj.edu.br")

    slots = grid(db_session, room, student, WEDNESDAY, local(WEDNESDAY, 6))

    assert slots["18:30"] == (SlotStatus.LIVRE, False, None)
    assert slots["19:00"] == (SlotStatus.OCUPADO, False, None)
    assert slots["19:30"] == (SlotStatus.OCUPADO, False, None)
    assert slots["20:00"] == (SlotStatus.LIVRE, False, None)
    assert slots["09:00"] == (SlotStatus.LIVRE, False, None)


def test_owner_recognizes_own_reservation_and_admin_sees_the_name(
    db_session: Session,
    room: Resource,
    owner: User,
    reserve: Callable[..., None],
    make_user: Callable[..., User],
) -> None:
    reserve(local(WEDNESDAY, 19), local(WEDNESDAY, 20))
    admin = make_user(email="admin@umj.edu.br", perfil=UserRole.ADMIN)

    as_owner = grid(db_session, room, owner, WEDNESDAY, local(WEDNESDAY, 6))
    as_admin = grid(db_session, room, admin, WEDNESDAY, local(WEDNESDAY, 6))

    assert as_owner["19:00"] == (SlotStatus.OCUPADO, True, None)
    assert as_admin["19:00"] == (SlotStatus.OCUPADO, False, "Maria Dona")


def test_slots_that_already_started_today_are_past(
    db_session: Session, room: Resource, owner: User, reserve: Callable[..., None]
) -> None:
    reserve(local(WEDNESDAY, 8), local(WEDNESDAY, 9))

    slots = grid(db_session, room, owner, WEDNESDAY, local(WEDNESDAY, 10, 10))

    assert slots["08:00"][0] is SlotStatus.PASSADO
    assert slots["10:00"][0] is SlotStatus.PASSADO
    assert slots["10:30"][0] is SlotStatus.LIVRE


def test_whole_past_day_is_past(db_session: Session, room: Resource, owner: User) -> None:
    slots = grid(db_session, room, owner, WEDNESDAY, local(date(2030, 10, 24), 8))

    assert {status for status, _, _ in slots.values()} == {SlotStatus.PASSADO}


def test_inactive_resource_is_not_found(db_session: Session, room: Resource, owner: User) -> None:
    room.ativo = False

    with pytest.raises(NotFoundError):
        service(db_session, local(WEDNESDAY, 6)).for_day(room.id, WEDNESDAY, owner)


def test_schedule_checks_alignment_and_opening_hours() -> None:
    assert SCHEDULE.is_aligned(local(WEDNESDAY, 19, 30))
    assert not SCHEDULE.is_aligned(local(WEDNESDAY, 19, 15))
    assert SCHEDULE.within_opening_hours(local(WEDNESDAY, 8), local(WEDNESDAY, 21))
    assert not SCHEDULE.within_opening_hours(local(WEDNESDAY, 20), local(WEDNESDAY, 21, 30))
    assert not SCHEDULE.within_opening_hours(local(SATURDAY, 11), local(SATURDAY, 13))
    assert not SCHEDULE.within_opening_hours(local(SUNDAY, 9), local(SUNDAY, 10))
