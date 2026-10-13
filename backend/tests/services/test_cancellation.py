from collections.abc import Callable
from datetime import datetime, timedelta

import pytest
from sqlalchemy.orm import Session

from app.core.enums import ReservationStatus, ResourceType, UserRole
from app.core.exceptions import DomainError, ForbiddenError, NotFoundError
from app.models.building import Building
from app.models.resource import Resource
from app.models.user import User
from app.schemas.reservation import ReservationCreate
from app.services.reservation_service import (
    AlreadyCancelledError,
    CancellationDeadlineError,
)
from tests.services.test_my_reservations import service
from tests.services.test_reservation_service import NOW, at

START, END = at(19), at(20)


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


def reserve(db_session: Session, room: Resource, user: User) -> int:
    data = ReservationCreate(recurso_id=room.id, inicio=START, fim=END)
    return service(db_session, NOW).create(data, user).id


def cancel_at(db_session: Session, now: datetime, reservation_id: int, user: User) -> None:
    service(db_session, now).cancel(reservation_id, user)


def test_owner_cancels_with_31_minutes_and_slot_is_free_again(
    db_session: Session, room: Resource, people: dict[str, User]
) -> None:
    reservation_id = reserve(db_session, room, people["lucas"])

    cancelled = service(db_session, START - timedelta(minutes=31)).cancel(
        reservation_id, people["lucas"]
    )

    assert cancelled.status is ReservationStatus.CANCELADA
    assert cancelled.cancelada_em == START - timedelta(minutes=31)
    assert cancelled.cancelada_por_id == people["lucas"].id
    # Outra pessoa consegue reservar o mesmo horário (História 03, CA2).
    assert reserve(db_session, room, people["ana"])


def test_owner_cannot_cancel_with_29_minutes(
    db_session: Session, room: Resource, people: dict[str, User]
) -> None:
    reservation_id = reserve(db_session, room, people["lucas"])

    with pytest.raises(CancellationDeadlineError):
        cancel_at(db_session, START - timedelta(minutes=29), reservation_id, people["lucas"])


def test_only_the_owner_cancels_here_and_admin_owns_no_deadline(
    db_session: Session, room: Resource, people: dict[str, User]
) -> None:
    reservation_id = reserve(db_session, room, people["lucas"])
    other_room = Resource(
        bloco=room.bloco, nome="Sala 2", tipo=ResourceType.SALA_ESTUDO, capacidade=4
    )
    db_session.add(other_room)
    db_session.flush()
    admin_reservation_id = reserve(db_session, other_room, people["admin"])

    # Reserva de outra pessoa, nem o admin: ele usa a agenda, que exige motivo (#30).
    for intruder in (people["ana"], people["admin"]):
        with pytest.raises(ForbiddenError):
            cancel_at(db_session, NOW, reservation_id, intruder)
    cancel_at(db_session, START - timedelta(minutes=5), admin_reservation_id, people["admin"])


def test_cancelling_twice_is_a_conflict(
    db_session: Session, room: Resource, people: dict[str, User]
) -> None:
    reservation_id = reserve(db_session, room, people["lucas"])
    cancel_at(db_session, NOW, reservation_id, people["lucas"])

    with pytest.raises(AlreadyCancelledError) as error:
        cancel_at(db_session, NOW, reservation_id, people["lucas"])

    assert error.value.status_code == 409


def test_unknown_reservation_is_404(db_session: Session, people: dict[str, User]) -> None:
    with pytest.raises(NotFoundError):
        cancel_at(db_session, NOW, 999_999, people["lucas"])


def test_errors_have_stable_codes() -> None:
    assert isinstance(CancellationDeadlineError(), DomainError)
    assert CancellationDeadlineError.code == "PRAZO_CANCELAMENTO_EXPIRADO"
    assert AlreadyCancelledError.code == "RESERVA_JA_CANCELADA"
