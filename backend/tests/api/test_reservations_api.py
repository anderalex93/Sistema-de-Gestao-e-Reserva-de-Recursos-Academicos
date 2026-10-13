from collections.abc import Callable
from datetime import UTC, datetime, time, timedelta
from zoneinfo import ZoneInfo

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.enums import ResourceType
from app.models.building import Building
from app.models.resource import Resource
from app.models.user import User
from tests.conftest import login

RESERVATIONS = "/api/v1/reservas"
MACEIO = ZoneInfo("America/Maceio")


def next_weekday_at(hour: int) -> datetime:
    """Próximo dia útil a partir de amanhã, no horário local pedido (o relógio é o real)."""
    day = datetime.now(MACEIO).date() + timedelta(days=1)
    while day.weekday() > 4:
        day += timedelta(days=1)
    return datetime.combine(day, time(hour), tzinfo=MACEIO).astimezone(UTC)


@pytest.fixture
def room(db_session: Session) -> Resource:
    resource = Resource(
        bloco=Building(nome="Bloco A"), nome="Sala 1", tipo=ResourceType.SALA_ESTUDO, capacidade=4
    )
    db_session.add(resource)
    db_session.flush()
    return resource


@pytest.fixture
def headers(client: TestClient, make_user: Callable[..., User]) -> dict[str, str]:
    make_user(email="lucas@umj.edu.br")
    return login(client, "lucas@umj.edu.br")


def payload(room: Resource, start: int = 19, end: int = 20) -> dict[str, object]:
    return {
        "recurso_id": room.id,
        "inicio": next_weekday_at(start).isoformat(),
        "fim": next_weekday_at(end).isoformat(),
        "finalidade": "Reunião do Projeto Integrador",
        "qtd_participantes": 3,
    }


def test_creates_and_reads_back_a_reservation(
    client: TestClient, headers: dict[str, str], room: Resource
) -> None:
    created = client.post(RESERVATIONS, headers=headers, json=payload(room))

    assert created.status_code == 201, created.text
    body = created.json()
    assert body["status"] == "CONFIRMADA"
    assert body["codigo"].startswith("EDU-")
    assert body["recurso"]["nome"] == "Sala 1"
    assert body["recurso"]["bloco"]["nome"] == "Bloco A"
    fetched = client.get(f"{RESERVATIONS}/{body['id']}", headers=headers)
    assert fetched.json()["codigo"] == body["codigo"]


def test_overlap_is_409_with_a_friendly_message(
    client: TestClient, headers: dict[str, str], room: Resource
) -> None:
    client.post(RESERVATIONS, headers=headers, json=payload(room, 19, 21))

    response = client.post(RESERVATIONS, headers=headers, json=payload(room, 20, 21))

    assert response.status_code == 409
    assert response.json()["code"] == "RESERVA_CONFLITO"
    assert "acabou de ser reservado" in response.json()["detail"]


def test_other_users_cannot_see_a_reservation(
    client: TestClient,
    headers: dict[str, str],
    room: Resource,
    make_user: Callable[..., User],
) -> None:
    reservation_id = client.post(RESERVATIONS, headers=headers, json=payload(room)).json()["id"]
    make_user(email="ana@umj.edu.br")

    response = client.get(
        f"{RESERVATIONS}/{reservation_id}", headers=login(client, "ana@umj.edu.br")
    )

    assert response.status_code == 404


@pytest.mark.parametrize(
    "change",
    [
        {"fim": None},
        {"recurso_id": 0},
        {"qtd_participantes": 0},
        {"finalidade": "x" * 201},
        {"inicio": "2030-10-23T19:00:00"},
        {"usuario_id": 1},
    ],
)
def test_rejects_invalid_payloads(
    client: TestClient, headers: dict[str, str], room: Resource, change: dict[str, object]
) -> None:
    body = {**payload(room), **change}

    assert client.post(RESERVATIONS, headers=headers, json=body).status_code == 422


def test_inverted_interval_is_422(
    client: TestClient, headers: dict[str, str], room: Resource
) -> None:
    assert client.post(RESERVATIONS, headers=headers, json=payload(room, 20, 19)).status_code == 422


def test_requires_login(client: TestClient, room: Resource) -> None:
    assert client.post(RESERVATIONS, json=payload(room)).status_code == 401
