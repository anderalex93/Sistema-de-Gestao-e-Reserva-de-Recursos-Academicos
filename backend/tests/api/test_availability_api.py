from collections.abc import Callable

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.enums import ResourceType
from app.models.building import Building
from app.models.resource import Resource
from app.models.user import User
from tests.conftest import login

# Uma quarta-feira bem no futuro: tudo livre, independente do relógio real.
FUTURE_WEDNESDAY = "2030-10-23"


@pytest.fixture
def headers(client: TestClient, make_user: Callable[..., User]) -> dict[str, str]:
    make_user(email="lucas@umj.edu.br")
    return login(client, "lucas@umj.edu.br")


@pytest.fixture
def room(db_session: Session) -> Resource:
    resource = Resource(
        bloco=Building(nome="Bloco A"), nome="Sala 1", tipo=ResourceType.SALA_ESTUDO, capacidade=4
    )
    db_session.add(resource)
    db_session.flush()
    return resource


def url(resource_id: int) -> str:
    return f"/api/v1/recursos/{resource_id}/disponibilidade"


def test_returns_the_day_grid(client: TestClient, headers: dict[str, str], room: Resource) -> None:
    response = client.get(url(room.id), headers=headers, params={"data": FUTURE_WEDNESDAY})

    assert response.status_code == 200
    body = response.json()
    assert (body["recurso_id"], body["data"]) == (room.id, FUTURE_WEDNESDAY)
    assert body["slots"][0] == {
        "inicio": "2030-10-23T11:00:00Z",
        "fim": "2030-10-23T11:30:00Z",
        "status": "LIVRE",
        "propria": False,
        "reservado_por": None,
    }


def test_unknown_or_inactive_resource_is_404(
    client: TestClient, headers: dict[str, str], room: Resource
) -> None:
    room.ativo = False

    response = client.get(url(room.id), headers=headers, params={"data": FUTURE_WEDNESDAY})

    assert response.status_code == 404


@pytest.mark.parametrize("params", [{}, {"data": "23/10/2030"}, {"data": "2030-02-30"}])
def test_requires_a_valid_date(
    client: TestClient, headers: dict[str, str], room: Resource, params: dict[str, str]
) -> None:
    assert client.get(url(room.id), headers=headers, params=params).status_code == 422


def test_requires_login(client: TestClient, room: Resource) -> None:
    assert client.get(url(room.id), params={"data": FUTURE_WEDNESDAY}).status_code == 401


def test_rules_are_public_and_list_the_opening_hours(client: TestClient) -> None:
    response = client.get("/api/v1/config/regras")

    assert response.status_code == 200
    body = response.json()
    assert (body["fuso"], body["intervalo_minutos"]) == ("America/Maceio", 30)
    assert body["horarios"][0] == {
        "dia_semana": 1,
        "abertura": "08:00:00",
        "fechamento": "21:00:00",
    }
    assert [day["dia_semana"] for day in body["horarios"]] == [1, 2, 3, 4, 5, 6]
    assert body["horarios"][-1]["fechamento"] == "12:00:00"
    assert (body["duracao_max_minutos"], body["antecedencia_max_dias"]) == (240, 14)
    assert body["limite_reservas_ativas"] == {"ALUNO": 3, "PROFESSOR": 10, "ADMIN": None}
