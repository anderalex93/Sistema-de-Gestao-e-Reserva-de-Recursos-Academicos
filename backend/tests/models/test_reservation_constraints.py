"""O banco garante o RNF03 sozinho, mesmo que o service falhe."""

from collections.abc import Callable
from datetime import UTC, datetime, timedelta
from itertools import count

import pytest
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.enums import ReservationStatus, ResourceType
from app.models.building import Building
from app.models.reservation import Reservation
from app.models.resource import Resource
from app.models.user import User

START = datetime(2026, 10, 21, 22, 0, tzinfo=UTC)
HOUR = timedelta(hours=1)


@pytest.fixture
def insert(db_session: Session, make_user: Callable[..., User]) -> Callable[..., None]:
    user = make_user()
    room = Resource(
        bloco=Building(nome="Bloco A"), nome="Sala 1", tipo=ResourceType.SALA_ESTUDO, capacidade=4
    )
    db_session.add(room)
    db_session.flush()
    codes = count(1)

    def factory(
        inicio: datetime,
        fim: datetime,
        status: ReservationStatus = ReservationStatus.CONFIRMADA,
    ) -> None:
        cancelled = status is ReservationStatus.CANCELADA
        with db_session.begin_nested():
            db_session.add(
                Reservation(
                    codigo=f"EDU-C{next(codes):05d}",
                    recurso_id=room.id,
                    usuario_id=user.id,
                    inicio=inicio,
                    fim=fim,
                    status=status,
                    cancelada_em=START if cancelled else None,
                )
            )

    return factory


def test_rejects_overlapping_confirmed_reservations(insert: Callable[..., None]) -> None:
    insert(START, START + 2 * HOUR)

    with pytest.raises(IntegrityError, match="reserva_sem_sobreposicao"):
        insert(START + HOUR, START + 3 * HOUR)


def test_allows_back_to_back_reservations(insert: Callable[..., None]) -> None:
    insert(START, START + HOUR)
    insert(START + HOUR, START + 2 * HOUR)
    insert(START - HOUR, START)


def test_cancelled_reservations_do_not_block(insert: Callable[..., None]) -> None:
    insert(START, START + HOUR, ReservationStatus.CANCELADA)
    insert(START, START + HOUR)


@pytest.mark.parametrize(
    ("inicio", "fim", "status"),
    [
        pytest.param(START, START, ReservationStatus.CONFIRMADA, id="fim igual ao início"),
        pytest.param(START, START - HOUR, ReservationStatus.CONFIRMADA, id="fim antes"),
    ],
)
def test_rejects_inverted_intervals(
    insert: Callable[..., None], inicio: datetime, fim: datetime, status: ReservationStatus
) -> None:
    with pytest.raises(IntegrityError, match="ck_reserva_fim_depois_do_inicio"):
        insert(inicio, fim, status)
