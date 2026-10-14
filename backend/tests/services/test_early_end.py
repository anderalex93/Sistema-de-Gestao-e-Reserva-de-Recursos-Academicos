"""Encerrar o uso mais cedo: janela, arredondamento para a grade, dono, estados inválidos e o
horário liberado voltando a ser reservável."""

from collections.abc import Callable
from datetime import UTC, datetime, timedelta

import pytest
from sqlalchemy.orm import Session

from app.core.enums import ReservationStatus, ResourceType, UserRole
from app.core.exceptions import ForbiddenError, NotFoundError
from app.db.unit_of_work import UnitOfWork
from app.models.building import Building
from app.models.reservation import Reservation
from app.models.resource import Resource
from app.models.user import User
from app.repositories.reservation_repository import ReservationRepository
from app.schemas.reservation import ReservationCreate
from app.services.no_show_service import NoShowService
from app.services.reservation_service import (
    AlreadyCancelledError,
    AlreadyEndedEarlyError,
    ReservationAlreadyEndedError,
    ReservationNotStartedError,
    ReservationReleasedError,
    ReservationService,
)
from tests.conftest import FixedClock
from tests.services.test_reservation_service import NOW, RULES, SCHEDULE, at, build_service

START, END = at(14), at(16)
SECOND = timedelta(seconds=1)


@pytest.fixture
def room(db_session: Session) -> Resource:
    resource = Resource(
        bloco=Building(nome="Bloco A"), nome="Sala 1", tipo=ResourceType.SALA_ESTUDO, capacidade=4
    )
    db_session.add(resource)
    db_session.flush()
    return resource


@pytest.fixture
def people(make_user: Callable[..., User]) -> dict[str, User]:
    return {
        "lucas": make_user(email="lucas@umj.edu.br"),
        "ana": make_user(email="ana@umj.edu.br"),
        "admin": make_user(email="admin@umj.edu.br", perfil=UserRole.ADMIN),
    }


def service(db_session: Session, now: datetime) -> ReservationService:
    return build_service(db_session, now=now.astimezone(UTC))


def reserve(db_session: Session, room: Resource, user: User) -> Reservation:
    data = ReservationCreate(recurso_id=room.id, inicio=START, fim=END)
    return service(db_session, NOW).create(data, user)


@pytest.mark.parametrize(
    ("now", "new_end"),
    [
        pytest.param(START, at(14, 30), id="no início, nunca antes de 30 min"),
        pytest.param(at(14, 10), at(14, 30), id="arredonda para o próximo bloco"),
        pytest.param(at(14, 30), at(14, 30), id="exatamente na marca"),
        pytest.param(at(14, 30) + SECOND, at(15), id="1s depois da marca"),
        pytest.param(at(15, 29), at(15, 30), id="último bloco antes do fim"),
    ],
)
def test_end_rounds_up_to_the_next_half_hour_and_keeps_the_original_end(
    db_session: Session,
    room: Resource,
    people: dict[str, User],
    now: datetime,
    new_end: datetime,
) -> None:
    reservation = reserve(db_session, room, people["lucas"])

    ended = service(db_session, now).end_early(reservation.id, people["lucas"])

    assert ended.status is ReservationStatus.CONFIRMADA
    assert ended.fim == new_end
    assert ended.fim_previsto == END
    assert ended.encerrada_em == now


def test_end_in_the_last_block_keeps_the_end(
    db_session: Session, room: Resource, people: dict[str, User]
) -> None:
    reservation = reserve(db_session, room, people["lucas"])

    ended = service(db_session, at(15, 40)).end_early(reservation.id, people["lucas"])

    assert (ended.fim, ended.fim_previsto, ended.encerrada_em) == (END, None, at(15, 40))


def test_freed_slot_can_be_reserved_by_someone_else(
    db_session: Session, room: Resource, people: dict[str, User]
) -> None:
    reservation = reserve(db_session, room, people["lucas"])
    now = at(14, 10)
    service(db_session, now).end_early(reservation.id, people["lucas"])

    data = ReservationCreate(recurso_id=room.id, inicio=at(14, 30), fim=END)
    created = service(db_session, now).create(data, people["ana"])

    assert (created.inicio, created.fim) == (at(14, 30), END)


def test_permission_follows_the_window(
    db_session: Session, room: Resource, people: dict[str, User]
) -> None:
    reservation = reserve(db_session, room, people["lucas"])

    def can_end(now: datetime) -> bool:
        return service(db_session, now).with_permissions(reservation).pode_encerrar

    assert not can_end(START - SECOND)
    assert can_end(START)
    assert can_end(END - SECOND)
    assert not can_end(END)
    service(db_session, at(14, 10)).end_early(reservation.id, people["lucas"])
    assert not can_end(at(14, 20))


@pytest.mark.parametrize(
    ("now", "error"),
    [
        pytest.param(START - SECOND, ReservationNotStartedError, id="antes do início"),
        pytest.param(END, ReservationAlreadyEndedError, id="no fim"),
    ],
)
def test_only_while_in_progress(
    db_session: Session,
    room: Resource,
    people: dict[str, User],
    now: datetime,
    error: type[Exception],
) -> None:
    reservation = reserve(db_session, room, people["lucas"])

    with pytest.raises(error):
        service(db_session, now).end_early(reservation.id, people["lucas"])


def test_errors_are_friendly() -> None:
    assert ReservationNotStartedError.code == "RESERVA_NAO_INICIADA"
    assert ReservationNotStartedError.status_code == 422
    assert AlreadyEndedEarlyError.code == "RESERVA_JA_ENCERRADA"
    assert AlreadyEndedEarlyError.status_code == 409


def test_only_the_owner_ends_not_even_the_admin(
    db_session: Session, room: Resource, people: dict[str, User]
) -> None:
    reservation = reserve(db_session, room, people["lucas"])

    for intruder in (people["ana"], people["admin"]):
        with pytest.raises(ForbiddenError):
            service(db_session, at(14, 10)).end_early(reservation.id, intruder)


def test_unknown_reservation_is_404(db_session: Session, people: dict[str, User]) -> None:
    with pytest.raises(NotFoundError):
        service(db_session, at(14, 10)).end_early(999_999, people["lucas"])


def test_ending_twice_is_a_conflict_with_the_time(
    db_session: Session, room: Resource, people: dict[str, User]
) -> None:
    reservation = reserve(db_session, room, people["lucas"])
    service(db_session, at(14, 10)).end_early(reservation.id, people["lucas"])

    with pytest.raises(AlreadyEndedEarlyError) as error:
        service(db_session, at(14, 20)).end_early(reservation.id, people["lucas"])

    assert error.value.detail == "O uso desta reserva já foi encerrado às 14:10."


def test_cancelled_or_released_cannot_be_ended(
    db_session: Session, room: Resource, people: dict[str, User]
) -> None:
    reservation = reserve(db_session, room, people["lucas"])
    reservation.status = ReservationStatus.CANCELADA
    reservation.cancelada_em = NOW
    db_session.flush()
    with pytest.raises(AlreadyCancelledError):
        service(db_session, at(14, 10)).end_early(reservation.id, people["lucas"])

    reservation.status = ReservationStatus.NAO_COMPARECEU
    reservation.cancelada_em = None
    reservation.liberada_em = at(14, 15)
    db_session.flush()
    with pytest.raises(ReservationReleasedError):
        service(db_session, at(14, 20)).end_early(reservation.id, people["lucas"])


def test_ended_without_checkin_is_not_a_no_show(
    db_session: Session, room: Resource, people: dict[str, User]
) -> None:
    reservation = reserve(db_session, room, people["lucas"])
    service(db_session, at(14, 5)).end_early(reservation.id, people["lucas"])

    clock = FixedClock(at(14, 20).astimezone(UTC))
    reservations = ReservationRepository(db_session)
    no_shows = NoShowService(
        reservations=reservations, uow=UnitOfWork(db_session), clock=clock, rules=RULES
    )
    no_shows.release_expired()
    db_session.refresh(reservation)

    assert reservation.status is ReservationStatus.CONFIRMADA
    assert reservation.liberada_em is None


def test_next_mark_ignores_seconds_on_the_mark() -> None:
    assert SCHEDULE.next_mark(at(14, 0)) == at(14, 0)
    assert SCHEDULE.next_mark(at(14, 0) + SECOND) == at(14, 30)
    assert SCHEDULE.next_mark(at(14, 59)) == at(15, 0)
