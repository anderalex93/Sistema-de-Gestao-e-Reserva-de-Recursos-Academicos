"""Check-in por QR Code e liberação por não comparecimento (#43): janela, situações,
idempotência, quem pode fazer e o horário liberado voltando para a grade."""

from collections.abc import Callable
from datetime import UTC, datetime, timedelta
from itertools import count

import pytest
from sqlalchemy.orm import Session

from app.core.enums import (
    CheckinSituation,
    ReservationScope,
    ReservationStatus,
    ResourceType,
    SlotStatus,
    UserRole,
)
from app.core.reservation_rules import ReservationRules
from app.db.unit_of_work import UnitOfWork
from app.models.building import Building
from app.models.reservation import Reservation
from app.models.resource import Resource
from app.models.user import User
from app.repositories.reservation_repository import ReservationRepository
from app.repositories.resource_repository import ResourceRepository
from app.schemas.reservation import ReservationCreate
from app.services.availability_service import AvailabilityService
from app.services.checkin_service import (
    CheckinOutsideWindowError,
    CheckinService,
    InvalidQrCodeError,
    NoReservationNowError,
)
from app.services.no_show_service import NoShowService
from app.services.reservation_service import ReservationReleasedError
from tests.conftest import FixedClock
from tests.services.test_reservation_service import (
    RULES,
    SCHEDULE,
    WEDNESDAY,
    at,
    build_service,
)

START, END = at(14), at(15)
OPENS = at(13, 45)
DEADLINE = at(14, 15)
SECOND = timedelta(seconds=1)
OPTIONAL_CHECKIN = ReservationRules(
    max_duration=RULES.max_duration,
    max_days_ahead=RULES.max_days_ahead,
    active_limits=RULES.active_limits,
    checkin_tolerance=timedelta(0),
)


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
def ana(make_user: Callable[..., User]) -> User:
    return make_user(email="ana@umj.edu.br", nome="Ana Souza")


@pytest.fixture
def add(db_session: Session, room: Resource) -> Callable[..., Reservation]:
    codes = count(1)

    def factory(
        user: User,
        start: datetime = START,
        end: datetime = END,
        checkin_em: datetime | None = None,
        status: ReservationStatus = ReservationStatus.CONFIRMADA,
    ) -> Reservation:
        reservation = Reservation(
            codigo=f"EDU-K{next(codes):05d}",
            recurso=room,
            usuario_id=user.id,
            inicio=start,
            fim=end,
            status=status,
            checkin_em=checkin_em,
            cancelada_em=start if status is ReservationStatus.CANCELADA else None,
        )
        db_session.add(reservation)
        db_session.flush()
        return reservation

    return factory


def service(db_session: Session, now: datetime, rules: ReservationRules = RULES) -> CheckinService:
    clock = FixedClock(now.astimezone(UTC))
    reservations = ReservationRepository(db_session)
    uow = UnitOfWork(db_session)
    return CheckinService(
        resources=ResourceRepository(db_session),
        reservations=reservations,
        no_shows=NoShowService(reservations=reservations, uow=uow, clock=clock, rules=rules),
        uow=uow,
        schedule=SCHEDULE,
        clock=clock,
        rules=rules,
    )


@pytest.mark.parametrize(
    ("now", "situation"),
    [
        pytest.param(OPENS - SECOND, CheckinSituation.CEDO, id="1s antes de abrir"),
        pytest.param(OPENS, CheckinSituation.DISPONIVEL, id="abertura"),
        pytest.param(START, CheckinSituation.DISPONIVEL, id="início"),
        pytest.param(DEADLINE - SECOND, CheckinSituation.DISPONIVEL, id="1s antes do prazo"),
        pytest.param(DEADLINE, CheckinSituation.LIBERADA, id="prazo"),
        pytest.param(END - SECOND, CheckinSituation.LIBERADA, id="1s antes do fim"),
        pytest.param(END, CheckinSituation.SEM_RESERVA, id="fim"),
    ],
)
def test_window_goes_from_lead_before_start_to_tolerance_after(
    db_session: Session,
    *,
    room: Resource,
    lucas: User,
    add: Callable[..., Reservation],
    now: datetime,
    situation: CheckinSituation,
) -> None:
    add(lucas)

    result = service(db_session, now).status(room.checkin_token, lucas)

    assert result.situacao is situation
    assert result.recurso.nome == "Sala 1"
    assert result.recurso.bloco.nome == "Bloco A"
    assert (result.reserva is None) is (situation is CheckinSituation.SEM_RESERVA)


def test_early_status_says_when_the_window_opens(
    db_session: Session, room: Resource, lucas: User, add: Callable[..., Reservation]
) -> None:
    add(lucas)

    result = service(db_session, at(9)).status(room.checkin_token, lucas)

    assert result.situacao is CheckinSituation.CEDO
    assert result.abre_em == OPENS
    assert result.reserva is not None
    assert result.reserva.checkin_em is None


def test_check_in_records_the_time_and_repeating_returns_the_same_reservation(
    db_session: Session, room: Resource, lucas: User, add: Callable[..., Reservation]
) -> None:
    reservation = add(lucas)

    first = service(db_session, at(13, 50)).check_in(room.checkin_token, lucas)
    again = service(db_session, at(14, 40)).check_in(room.checkin_token, lucas)
    status = service(db_session, at(14, 40)).status(room.checkin_token, lucas)

    assert first.id == again.id == reservation.id
    assert again.checkin_em == at(13, 50)
    assert again.status is ReservationStatus.CONFIRMADA
    assert status.situacao is CheckinSituation.FEITO
    assert status.abre_em is None


@pytest.mark.parametrize("now", [OPENS, DEADLINE - SECOND], ids=["abertura", "prazo"])
def test_check_in_is_accepted_at_both_ends_of_the_window(
    db_session: Session,
    room: Resource,
    lucas: User,
    add: Callable[..., Reservation],
    now: datetime,
) -> None:
    add(lucas)

    reservation = service(db_session, now).check_in(room.checkin_token, lucas)

    assert reservation.checkin_em == now


def test_too_early_is_rejected_with_the_local_opening_time(
    db_session: Session, room: Resource, lucas: User, add: Callable[..., Reservation]
) -> None:
    reservation = add(lucas)

    with pytest.raises(CheckinOutsideWindowError) as error:
        service(db_session, OPENS - SECOND).check_in(room.checkin_token, lucas)

    assert (error.value.status_code, error.value.code) == (422, "CHECKIN_FORA_DA_JANELA")
    assert "13:45" in error.value.detail
    assert reservation.checkin_em is None


def test_after_the_deadline_the_reservation_is_released_and_check_in_is_a_conflict(
    db_session: Session, room: Resource, lucas: User, add: Callable[..., Reservation]
) -> None:
    reservation = add(lucas)

    with pytest.raises(ReservationReleasedError) as error:
        service(db_session, DEADLINE).check_in(room.checkin_token, lucas)

    assert (error.value.status_code, error.value.code) == (409, "RESERVA_LIBERADA")
    db_session.refresh(reservation)
    assert reservation.status is ReservationStatus.NAO_COMPARECEU
    assert reservation.liberada_em == DEADLINE
    assert reservation.checkin_em is None


def test_without_a_reservation_today_there_is_nothing_to_check_in(
    db_session: Session, room: Resource, lucas: User, add: Callable[..., Reservation]
) -> None:
    add(lucas, at(14, day=WEDNESDAY + timedelta(days=1)), at(15, day=WEDNESDAY + timedelta(days=1)))
    add(lucas, at(9), at(10), checkin_em=at(9))
    add(lucas, at(11), at(12), status=ReservationStatus.CANCELADA)

    status = service(db_session, at(12, 30)).status(room.checkin_token, lucas)
    with pytest.raises(NoReservationNowError) as error:
        service(db_session, at(12, 30)).check_in(room.checkin_token, lucas)

    assert status.situacao is CheckinSituation.SEM_RESERVA
    assert (status.reserva, status.abre_em) == (None, None)
    assert (error.value.status_code, error.value.code) == (404, "SEM_RESERVA_AGORA")


def test_nobody_checks_in_on_someone_elses_reservation(
    db_session: Session,
    room: Resource,
    lucas: User,
    ana: User,
    add: Callable[..., Reservation],
) -> None:
    reservation = add(lucas)

    status = service(db_session, at(13, 50)).status(room.checkin_token, ana)
    with pytest.raises(NoReservationNowError):
        service(db_session, at(13, 50)).check_in(room.checkin_token, ana)

    assert status.situacao is CheckinSituation.SEM_RESERVA
    assert reservation.checkin_em is None


def test_unknown_token_or_inactive_resource_is_an_invalid_qr_code(
    db_session: Session, room: Resource, lucas: User, add: Callable[..., Reservation]
) -> None:
    add(lucas)
    checkin = service(db_session, at(13, 50))

    with pytest.raises(InvalidQrCodeError) as unknown:
        checkin.status("nao-existe", lucas)
    room.ativo = False
    db_session.flush()
    with pytest.raises(InvalidQrCodeError):
        checkin.check_in(room.checkin_token, lucas)
    room.ativo = True
    room.bloco.ativo = False
    db_session.flush()
    with pytest.raises(InvalidQrCodeError):
        checkin.status(room.checkin_token, lucas)

    assert (unknown.value.status_code, unknown.value.code) == (404, "QR_INVALIDO")


def test_a_new_booking_in_the_released_time_takes_priority_over_the_released_one(
    db_session: Session, room: Resource, lucas: User, add: Callable[..., Reservation]
) -> None:
    released = add(lucas)
    service(db_session, DEADLINE).status(room.checkin_token, lucas)
    rebooked = add(lucas, at(14, 30), END)

    status = service(db_session, at(14, 20)).status(room.checkin_token, lucas)

    assert released.status is ReservationStatus.NAO_COMPARECEU
    assert status.situacao is CheckinSituation.DISPONIVEL
    assert status.reserva is not None
    assert status.reserva.id == rebooked.id


def test_released_reservation_shows_before_a_later_one_of_the_same_day(
    db_session: Session, room: Resource, lucas: User, add: Callable[..., Reservation]
) -> None:
    released = add(lucas)
    add(lucas, at(18), at(19))

    status = service(db_session, at(14, 20)).status(room.checkin_token, lucas)

    assert status.situacao is CheckinSituation.LIBERADA
    assert status.reserva is not None
    assert status.reserva.id == released.id
    assert status.reserva.liberada_em == at(14, 20)


def test_window_open_for_the_next_reservation_takes_priority_over_the_current_check_in(
    db_session: Session, room: Resource, lucas: User, add: Callable[..., Reservation]
) -> None:
    add(lucas, checkin_em=at(14))
    following = add(lucas, END, at(16))

    reservation = service(db_session, at(14, 50)).check_in(room.checkin_token, lucas)

    assert reservation.id == following.id
    assert reservation.checkin_em == at(14, 50)


def test_with_zero_tolerance_check_in_is_optional_until_the_end(
    db_session: Session, room: Resource, lucas: User, add: Callable[..., Reservation]
) -> None:
    reservation = add(lucas)
    checkin = service(db_session, END - SECOND, OPTIONAL_CHECKIN)

    assert checkin.status(room.checkin_token, lucas).situacao is CheckinSituation.DISPONIVEL
    assert checkin.check_in(room.checkin_token, lucas).checkin_em == END - SECOND
    assert reservation.status is ReservationStatus.CONFIRMADA


# Liberação automática por não comparecimento


def release(db_session: Session, now: datetime, rules: ReservationRules = RULES) -> int:
    return NoShowService(
        reservations=ReservationRepository(db_session),
        uow=UnitOfWork(db_session),
        clock=FixedClock(now.astimezone(UTC)),
        rules=rules,
    ).release_expired()


def test_releases_every_confirmed_reservation_without_check_in_after_the_tolerance(
    db_session: Session, lucas: User, ana: User, add: Callable[..., Reservation]
) -> None:
    mine = add(lucas)
    hers = add(ana, at(13, 30), at(14))

    released = release(db_session, DEADLINE)

    assert released == 2
    for reservation in (mine, hers):
        db_session.refresh(reservation)
        assert reservation.status is ReservationStatus.NAO_COMPARECEU
        assert reservation.liberada_em == DEADLINE
    assert release(db_session, DEADLINE + timedelta(minutes=5)) == 0


def test_keeps_reservations_with_check_in_cancelled_or_still_within_the_tolerance(
    db_session: Session, lucas: User, ana: User, add: Callable[..., Reservation]
) -> None:
    present = add(lucas, checkin_em=at(13, 50))
    on_time = add(ana, END, at(16))
    cancelled = add(ana, at(13), at(14), status=ReservationStatus.CANCELADA)

    assert release(db_session, DEADLINE - SECOND) == 0
    assert release(db_session, at(15, 14)) == 0

    for reservation in (present, on_time, cancelled):
        db_session.refresh(reservation)
        assert reservation.liberada_em is None
    assert present.status is ReservationStatus.CONFIRMADA
    assert on_time.status is ReservationStatus.CONFIRMADA


def test_zero_tolerance_turns_the_release_off(
    db_session: Session, lucas: User, add: Callable[..., Reservation]
) -> None:
    reservation = add(lucas)

    assert release(db_session, END - SECOND, OPTIONAL_CHECKIN) == 0

    db_session.refresh(reservation)
    assert reservation.status is ReservationStatus.CONFIRMADA


def test_released_time_is_free_again_and_can_be_booked_for_the_rest_of_the_slot(
    db_session: Session, room: Resource, lucas: User, ana: User, add: Callable[..., Reservation]
) -> None:
    add(lucas)
    now = at(14, 16).astimezone(UTC)
    release(db_session, now)

    grid = AvailabilityService(
        ResourceRepository(db_session), ReservationRepository(db_session), SCHEDULE, FixedClock(now)
    ).for_day(room.id, WEDNESDAY, ana)
    rebooked = build_service(db_session, now=now).create(
        ReservationCreate(recurso_id=room.id, inicio=at(14, 30), fim=END), ana
    )

    statuses = {slot.inicio: slot.status for slot in grid.slots}
    assert statuses[START] is SlotStatus.PASSADO
    assert statuses[at(14, 30)] is SlotStatus.LIVRE
    assert rebooked.status is ReservationStatus.CONFIRMADA


def test_released_reservation_goes_to_history_and_cannot_be_cancelled(
    db_session: Session, make_user: Callable[..., User], add: Callable[..., Reservation]
) -> None:
    admin = make_user(email="admin@umj.edu.br", perfil=UserRole.ADMIN)
    reservation = add(admin)
    now = at(14, 20)
    release(db_session, now)
    reservations = build_service(db_session, now=now)

    upcoming = reservations.list_mine(admin, ReservationScope.PROXIMAS, 1, 20)
    history = reservations.list_mine(admin, ReservationScope.HISTORICO, 1, 20)

    assert upcoming.items == []
    assert [item.id for item in history.items] == [reservation.id]
    assert history.items[0].status is ReservationStatus.NAO_COMPARECEU
    assert history.items[0].pode_cancelar is False
    with pytest.raises(ReservationReleasedError):
        reservations.cancel(reservation.id, admin)
    with pytest.raises(ReservationReleasedError):
        reservations.cancel_by_admin(reservation.id, admin, "Evento institucional")


def test_receipt_shows_when_the_check_in_happened(
    db_session: Session, lucas: User, add: Callable[..., Reservation]
) -> None:
    reservation = add(lucas, checkin_em=at(13, 50))

    receipt = build_service(db_session).receipt(reservation.codigo)

    assert receipt.checkin_em == at(13, 50)


def test_window_that_opens_the_day_before_finds_the_midnight_reservation(
    db_session: Session, room: Resource, lucas: User, add: Callable[..., Reservation]
) -> None:
    """A janela abre antes do início: uma reserva às 00:00 já aceita check-in às 23:50 da
    véspera, mesmo sendo de outro dia no calendário do campus."""
    midnight = at(0) + timedelta(days=1)
    add(lucas, start=midnight, end=midnight + timedelta(minutes=30))
    checkin = service(db_session, midnight - timedelta(minutes=10))

    assert checkin.status(room.checkin_token, lucas).situacao is CheckinSituation.DISPONIVEL
    assert checkin.check_in(room.checkin_token, lucas).checkin_em is not None
