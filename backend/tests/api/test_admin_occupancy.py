"""Painel de ocupação pela API (#44): só administradores, liberação de não comparecimento
antes do cálculo e a planilha CSV no formato do Excel em pt-BR."""

from collections.abc import Callable
from datetime import UTC, date, datetime, time

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.api.dependencies import get_clock
from app.core.enums import ResourceType, UserRole
from app.models.building import Building
from app.models.reservation import Reservation
from app.models.resource import Resource
from app.models.user import User
from tests.conftest import FixedClock, login
from tests.services.test_reservation_service import MACEIO

OCCUPANCY = "/api/v1/admin/ocupacao"
CSV = f"{OCCUPANCY}.csv"
# Quarta-feira no passado: o relógio fixo também emite o JWT, que recusa `iat` no futuro.
WEDNESDAY = date(2026, 10, 7)
DAY = {"inicio": "2026-10-07", "fim": "2026-10-07"}
BOM = b"\xef\xbb\xbf"
HEADER = (
    "Recurso;Bloco;Tipo;Horas disponíveis;Horas reservadas;Ocupação (%);Reservas;"
    "Cancelamentos;Não comparecimentos;Horas devolvidas"
)


def at(hour: int, minute: int = 0) -> datetime:
    return datetime.combine(WEDNESDAY, time(hour, minute), tzinfo=MACEIO).astimezone(UTC)


@pytest.fixture(autouse=True)
def clock(app: FastAPI) -> FixedClock:
    fixed = FixedClock(at(13, 50))
    app.dependency_overrides[get_clock] = lambda: fixed
    return fixed


@pytest.fixture
def lucas(make_user: Callable[..., User]) -> User:
    return make_user(email="lucas@umj.edu.br")


@pytest.fixture
def admin_headers(client: TestClient, make_user: Callable[..., User]) -> dict[str, str]:
    admin = make_user(email="admin@umj.edu.br", perfil=UserRole.ADMIN, nome="Admin")
    return login(client, admin.email)


@pytest.fixture
def scenario(db_session: Session, lucas: User) -> None:
    bloco = Building(nome="Bloco A")
    room = Resource(bloco=bloco, nome="Sala 1", tipo=ResourceType.SALA_ESTUDO, capacidade=4)
    # Nome que o Excel leria como fórmula.
    projector = Resource(bloco=bloco, nome="+Projetor", tipo=ResourceType.EQUIPAMENTO)
    db_session.add_all(
        [
            Reservation(
                codigo="EDU-OC001",
                recurso=room,
                usuario_id=lucas.id,
                inicio=at(8),
                fim=at(10),
                checkin_em=at(8, 5),
            ),
            # Sem check-in e já passou da tolerância: a rota libera antes de calcular.
            Reservation(
                codigo="EDU-OC002", recurso=room, usuario_id=lucas.id, inicio=at(13), fim=at(15)
            ),
            projector,
        ]
    )
    db_session.flush()


def test_requires_login(client: TestClient) -> None:
    responses = [client.get(OCCUPANCY), client.get(CSV)]

    assert [r.status_code for r in responses] == [401, 401]
    assert responses[0].json()["code"] == "NAO_AUTENTICADO"


def test_only_admins(client: TestClient, lucas: User) -> None:
    headers = login(client, lucas.email)

    responses = [client.get(OCCUPANCY, headers=headers), client.get(CSV, headers=headers)]

    assert [r.status_code for r in responses] == [403, 403]
    assert responses[1].json()["code"] == "ACESSO_NEGADO"


@pytest.mark.usefixtures("scenario")
def test_releases_no_shows_before_computing(
    client: TestClient, admin_headers: dict[str, str]
) -> None:
    response = client.get(OCCUPANCY, params=DAY, headers=admin_headers)

    assert response.status_code == 200, response.text
    body = response.json()
    assert body["periodo"] == DAY
    assert body["resumo"] == {
        "horas_disponiveis": 26.0,
        "horas_reservadas": 2.0,
        "taxa_ocupacao": 0.077,
        "reservas": 2,
        "cancelamentos": 0,
        "taxa_cancelamento": 0.0,
        "checkins": 1,
        "nao_comparecimentos": 1,
        "taxa_comparecimento": 0.5,
        # Liberada às 13:50, devolveu até as 15:00.
        "horas_devolvidas": 1.2,
    }
    assert {"dia_semana": 3, "hora": 8, "taxa": 0.5} in body["mapa_calor"]
    assert [r["nome"] for r in body["recursos"]] == ["Sala 1", "+Projetor"]


@pytest.mark.usefixtures("scenario")
def test_defaults_to_the_last_30_days(client: TestClient, admin_headers: dict[str, str]) -> None:
    response = client.get(OCCUPANCY, headers=admin_headers)

    assert response.json()["periodo"] == {"inicio": "2026-09-08", "fim": "2026-10-07"}


@pytest.mark.usefixtures("scenario")
def test_csv_opens_in_excel_pt_br(client: TestClient, admin_headers: dict[str, str]) -> None:
    response = client.get(CSV, params=DAY, headers=admin_headers)

    assert response.status_code == 200, response.text
    assert response.headers["content-type"] == "text/csv; charset=utf-8"
    assert response.headers["content-disposition"] == (
        'attachment; filename="ocupacao-2026-10-07-a-2026-10-07.csv"'
    )
    assert response.content.startswith(BOM)
    lines = response.content.decode("utf-8-sig").split("\r\n")
    assert lines == [
        HEADER,
        "Sala 1;Bloco A;Sala de estudo;13,0;2,0;15,4;2;0;1;1,2",
        "'+Projetor;Bloco A;Equipamento;13,0;0,0;0,0;0;0;0;0,0",
        "",
    ]
    # Nenhum dado pessoal: nem e-mail nem nome de quem reservou.
    assert "@" not in response.text
    assert "Lucas" not in response.text


@pytest.mark.parametrize("url", [OCCUPANCY, CSV])
def test_invalid_period_is_a_friendly_error(
    client: TestClient, admin_headers: dict[str, str], url: str
) -> None:
    too_long = client.get(url, params={"inicio": "2026-01-01"}, headers=admin_headers)
    inverted = client.get(
        url, params={"inicio": "2026-10-07", "fim": "2026-10-01"}, headers=admin_headers
    )
    malformed = client.get(url, params={"inicio": "07/10/2026"}, headers=admin_headers)

    assert (too_long.status_code, too_long.json()["code"]) == (422, "PERIODO_INVALIDO")
    assert "92 dias" in too_long.json()["detail"]
    assert inverted.json()["code"] == "PERIODO_INVALIDO"
    assert malformed.status_code == 422
