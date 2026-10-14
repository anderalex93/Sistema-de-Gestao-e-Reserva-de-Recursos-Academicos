"""Configurações do campus pela administração: horário de funcionamento e regras de uso, com
efeito imediato no que o resto da API usa e os valores do ambiente enquanto ninguém salvou."""

from collections.abc import Callable
from datetime import UTC, datetime, timedelta
from typing import Any

import pytest
from fastapi.testclient import TestClient

from app.core.enums import UserRole
from app.models.user import User
from tests.conftest import login

SETTINGS = "/api/v1/admin/configuracoes"
RULES = "/api/v1/config/regras"


def weekdays(opening: str = "08:00", closing: str = "21:00") -> list[dict[str, Any]]:
    return [{"dia_semana": day, "abertura": opening, "fechamento": closing} for day in range(1, 6)]


def payload(**changes: Any) -> dict[str, Any]:
    body: dict[str, Any] = {
        "horarios": [*weekdays(), {"dia_semana": 7, "abertura": "10:00", "fechamento": "14:00"}],
        "duracao_max_minutos": 120,
        "antecedencia_max_dias": 7,
        "limite_ativas_aluno": 2,
        "limite_ativas_professor": 5,
        "checkin_tolerancia_min": 10,
        "checkin_antecedencia_min": 20,
    }
    return body | changes


@pytest.fixture
def admin_headers(client: TestClient, make_user: Callable[..., User]) -> dict[str, str]:
    admin = make_user(email="admin@umj.edu.br", perfil=UserRole.ADMIN, nome="Marta Silva")
    return login(client, admin.email)


def test_only_admins(client: TestClient, make_user: Callable[..., User]) -> None:
    assert client.get(SETTINGS).status_code == 401
    student = login(client, make_user().email)
    assert client.get(SETTINGS, headers=student).status_code == 403
    assert client.put(SETTINGS, json=payload(), headers=student).status_code == 403


def test_shows_the_environment_values_until_someone_saves(
    client: TestClient, admin_headers: dict[str, str]
) -> None:
    body = client.get(SETTINGS, headers=admin_headers).json()

    assert body["origem"] == "AMBIENTE"
    assert body["atualizado_em"] is None
    assert body["atualizado_por"] is None
    rules = client.get(RULES).json()
    assert body["horarios"] == rules["horarios"]
    assert body["duracao_max_minutos"] == rules["duracao_max_minutos"]
    assert body["limite_ativas_aluno"] == rules["limite_reservas_ativas"]["ALUNO"]


def test_saved_settings_apply_right_away(client: TestClient, admin_headers: dict[str, str]) -> None:
    saved = client.put(SETTINGS, json=payload(), headers=admin_headers)

    assert saved.status_code == 200, saved.text
    body = saved.json()
    assert body["origem"] == "ADMINISTRACAO"
    assert body["atualizado_por"] == "Marta Silva"
    assert body["atualizado_em"] is not None
    rules = client.get(RULES).json()
    assert rules["duracao_max_minutos"] == 120
    assert rules["antecedencia_max_dias"] == 7
    assert rules["limite_reservas_ativas"] == {"ALUNO": 2, "PROFESSOR": 5, "ADMIN": None}
    assert rules["checkin_tolerancia_min"] == 10
    assert rules["checkin_antecedencia_min"] == 20
    assert rules["horarios"][-1] == {
        "dia_semana": 7,
        "abertura": "10:00:00",
        "fechamento": "14:00:00",
    }
    assert client.get(SETTINGS, headers=admin_headers).json() == body


def test_opening_a_day_shows_it_on_the_board(
    client: TestClient, admin_headers: dict[str, str]
) -> None:
    today = datetime.now(UTC).date()
    sunday = today + timedelta(days=(6 - today.weekday()) or 7)
    board = f"/api/v1/quadro?data={sunday.isoformat()}"
    assert client.get(board, headers=admin_headers).json()["abertura"] is None

    client.put(SETTINGS, json=payload(), headers=admin_headers)

    opened = client.get(board, headers=admin_headers).json()
    assert (opened["abertura"], opened["fechamento"]) == ("10:00:00", "14:00:00")


def test_saving_again_updates_the_same_settings(
    client: TestClient, admin_headers: dict[str, str]
) -> None:
    client.put(SETTINGS, json=payload(), headers=admin_headers)
    again = client.put(
        SETTINGS, json=payload(horarios=weekdays("07:30", "22:00")), headers=admin_headers
    )

    assert again.status_code == 200
    assert [day["dia_semana"] for day in again.json()["horarios"]] == [1, 2, 3, 4, 5]
    assert again.json()["horarios"][0]["abertura"] == "07:30:00"


@pytest.mark.parametrize(
    "changes",
    [
        {"horarios": []},
        {"horarios": weekdays("09:00", "08:00")},
        {"horarios": weekdays("08:15", "12:00")},
        {"horarios": [*weekdays(), {"dia_semana": 1, "abertura": "08:00", "fechamento": "09:00"}]},
        {"horarios": [{"dia_semana": 8, "abertura": "08:00", "fechamento": "09:00"}]},
        {"duracao_max_minutos": 45},
        {"duracao_max_minutos": 0},
        {"antecedencia_max_dias": 0},
        {"limite_ativas_aluno": 0},
        {"checkin_tolerancia_min": -1},
        {"desconhecido": 1},
    ],
)
def test_rejects_invalid_settings(
    client: TestClient, admin_headers: dict[str, str], changes: dict[str, Any]
) -> None:
    response = client.put(SETTINGS, json=payload(**changes), headers=admin_headers)

    assert response.status_code == 422
    assert client.get(SETTINGS, headers=admin_headers).json()["origem"] == "AMBIENTE"
