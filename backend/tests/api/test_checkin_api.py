"""Check-in por QR Code e liberação por não comparecimento pela API (#43), com relógio fixo."""

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

CHECKIN = "/api/v1/checkin"
# Quarta-feira no passado: o relógio fixo também emite o JWT, que recusa `iat` no futuro.
WEDNESDAY = date(2026, 10, 7)


def at(hour: int, minute: int = 0) -> datetime:
    return datetime.combine(WEDNESDAY, time(hour, minute), tzinfo=MACEIO).astimezone(UTC)


START, END = at(14), at(15)


@pytest.fixture(autouse=True)
def clock(app: FastAPI) -> FixedClock:
    fixed = FixedClock(at(13, 50))
    app.dependency_overrides[get_clock] = lambda: fixed
    return fixed


@pytest.fixture
def room(db_session: Session) -> Resource:
    resource = Resource(
        bloco=Building(nome="Bloco A"),
        nome="Sala 1",
        tipo=ResourceType.SALA_ESTUDO,
        capacidade=4,
        andar="Térreo",
    )
    db_session.add(resource)
    db_session.flush()
    return resource


@pytest.fixture
def lucas(make_user: Callable[..., User]) -> User:
    return make_user(email="lucas@umj.edu.br")


@pytest.fixture
def headers(client: TestClient, lucas: User) -> dict[str, str]:
    return login(client, lucas.email)


@pytest.fixture
def admin_headers(client: TestClient, make_user: Callable[..., User]) -> dict[str, str]:
    admin = make_user(email="admin@umj.edu.br", perfil=UserRole.ADMIN, nome="Admin")
    return login(client, admin.email)


@pytest.fixture
def reservation(db_session: Session, room: Resource, lucas: User) -> Reservation:
    created = Reservation(
        codigo="EDU-QR001", recurso=room, usuario_id=lucas.id, inicio=START, fim=END
    )
    db_session.add(created)
    db_session.flush()
    return created


def test_check_in_requires_login(client: TestClient, room: Resource) -> None:
    status = client.get(f"{CHECKIN}/{room.checkin_token}")
    check_in = client.post(f"{CHECKIN}/{room.checkin_token}")

    assert (status.status_code, check_in.status_code) == (401, 401)
    assert check_in.json()["code"] == "NAO_AUTENTICADO"


def test_reads_the_qr_code_checks_in_and_reads_again(
    client: TestClient, headers: dict[str, str], room: Resource, reservation: Reservation
) -> None:
    url = f"{CHECKIN}/{room.checkin_token}"

    before = client.get(url, headers=headers)
    checked = client.post(url, headers=headers)
    again = client.post(url, headers=headers)
    after = client.get(url, headers=headers)

    assert before.status_code == 200, before.text
    body = before.json()
    assert body["situacao"] == "DISPONIVEL"
    assert body["recurso"] == {
        "id": room.id,
        "nome": "Sala 1",
        "tipo": "SALA_ESTUDO",
        "andar": "Térreo",
        "bloco": {"id": room.bloco.id, "nome": "Bloco A", "descricao": None},
    }
    assert body["reserva"]["id"] == reservation.id
    assert body["abre_em"] is None
    assert checked.status_code == 200, checked.text
    assert datetime.fromisoformat(checked.json()["checkin_em"]) == at(13, 50)
    assert checked.json()["liberada_em"] is None
    assert again.json() == checked.json()
    assert after.json()["situacao"] == "FEITO"


@pytest.mark.usefixtures("reservation")
def test_too_early_tells_when_the_window_opens(
    client: TestClient, headers: dict[str, str], clock: FixedClock, room: Resource
) -> None:
    clock.current = at(10)
    url = f"{CHECKIN}/{room.checkin_token}"

    status = client.get(url, headers=headers)
    response = client.post(url, headers=headers)

    assert status.json()["situacao"] == "CEDO"
    assert datetime.fromisoformat(status.json()["abre_em"]) == at(13, 45)
    assert response.status_code == 422
    assert response.json()["code"] == "CHECKIN_FORA_DA_JANELA"
    assert "13:45" in response.json()["detail"]


@pytest.mark.usefixtures("reservation")
def test_after_the_tolerance_the_reservation_is_released(
    client: TestClient, headers: dict[str, str], clock: FixedClock, room: Resource
) -> None:
    clock.current = at(14, 15)
    url = f"{CHECKIN}/{room.checkin_token}"

    status = client.get(url, headers=headers)
    response = client.post(url, headers=headers)

    assert status.json()["situacao"] == "LIBERADA"
    assert status.json()["reserva"]["status"] == "NAO_COMPARECEU"
    assert datetime.fromisoformat(status.json()["reserva"]["liberada_em"]) == at(14, 15)
    assert response.status_code == 409
    assert response.json()["code"] == "RESERVA_LIBERADA"


def test_without_a_reservation_now_or_with_an_unknown_code(
    client: TestClient, headers: dict[str, str], room: Resource
) -> None:
    status = client.get(f"{CHECKIN}/{room.checkin_token}", headers=headers)
    response = client.post(f"{CHECKIN}/{room.checkin_token}", headers=headers)
    unknown = client.get(f"{CHECKIN}/nao-existe", headers=headers)

    assert status.json()["situacao"] == "SEM_RESERVA"
    assert status.json()["reserva"] is None
    assert (response.status_code, response.json()["code"]) == (404, "SEM_RESERVA_AGORA")
    assert (unknown.status_code, unknown.json()["code"]) == (404, "QR_INVALIDO")


def test_released_time_shows_free_on_the_grid_and_in_the_admin_agenda(
    client: TestClient,
    *,
    headers: dict[str, str],
    admin_headers: dict[str, str],
    clock: FixedClock,
    room: Resource,
    reservation: Reservation,
) -> None:
    clock.current = at(14, 16)

    grid = client.get(
        f"/api/v1/recursos/{room.id}/disponibilidade",
        headers=headers,
        params={"data": WEDNESDAY.isoformat()},
    )
    agenda = client.get(
        "/api/v1/admin/reservas",
        headers=admin_headers,
        params={"data": WEDNESDAY.isoformat(), "status": "NAO_COMPARECEU"},
    )
    rebooked = client.post(
        "/api/v1/reservas",
        headers=headers,
        json={"recurso_id": room.id, "inicio": at(14, 30).isoformat(), "fim": END.isoformat()},
    )

    slots = {
        datetime.fromisoformat(slot["inicio"]): slot["status"] for slot in grid.json()["slots"]
    }
    assert slots[at(14, 30)] == "LIVRE"
    assert [item["id"] for item in agenda.json()["items"]] == [reservation.id]
    assert agenda.json()["items"][0]["status"] == "NAO_COMPARECEU"
    assert rebooked.status_code == 201, rebooked.text


@pytest.mark.usefixtures("reservation")
def test_released_reservation_is_in_the_history_and_the_receipt_shows_the_check_in(
    client: TestClient,
    *,
    headers: dict[str, str],
    clock: FixedClock,
    db_session: Session,
    room: Resource,
    lucas: User,
) -> None:
    attended = Reservation(
        codigo="EDU-QR002",
        recurso=room,
        usuario_id=lucas.id,
        inicio=at(9),
        fim=at(10),
        checkin_em=at(9, 5),
    )
    db_session.add(attended)
    db_session.flush()
    clock.current = at(14, 20)

    history = client.get("/api/v1/reservas/minhas", headers=headers, params={"escopo": "historico"})
    receipt = client.get("/api/v1/reservas/comprovante/EDU-QR002")

    statuses = {item["codigo"]: item["status"] for item in history.json()["items"]}
    assert statuses == {"EDU-QR001": "NAO_COMPARECEU", "EDU-QR002": "CONFIRMADA"}
    assert datetime.fromisoformat(receipt.json()["checkin_em"]) == at(9, 5)


def test_rules_expose_the_check_in_window(client: TestClient) -> None:
    body = client.get("/api/v1/config/regras").json()

    assert (body["checkin_tolerancia_min"], body["checkin_antecedencia_min"]) == (15, 15)


@pytest.mark.usefixtures("reservation")
def test_admin_sees_and_renews_the_qr_code_token(
    client: TestClient,
    headers: dict[str, str],
    admin_headers: dict[str, str],
    room: Resource,
) -> None:
    old = room.checkin_token
    url = f"/api/v1/admin/recursos/{room.id}"

    shown = client.get(url, headers=admin_headers)
    forbidden = client.post(f"{url}/checkin/renovar", headers=headers)
    renewed = client.post(f"{url}/checkin/renovar", headers=admin_headers)
    missing = client.post("/api/v1/admin/recursos/999999/checkin/renovar", headers=admin_headers)

    assert shown.json()["checkin_token"] == old
    assert (forbidden.status_code, forbidden.json()["code"]) == (403, "ACESSO_NEGADO")
    assert renewed.status_code == 200, renewed.text
    new = renewed.json()["checkin_token"]
    assert new != old
    assert len(new) >= 20
    assert missing.status_code == 404
    stale = client.post(f"{CHECKIN}/{old}", headers=headers)
    assert (stale.status_code, stale.json()["code"]) == (404, "QR_INVALIDO")
    assert client.post(f"{CHECKIN}/{new}", headers=headers).status_code == 200


def test_resources_get_distinct_tokens(db_session: Session, room: Resource) -> None:
    other = Resource(bloco=room.bloco, nome="Sala 2", tipo=ResourceType.SALA_ESTUDO, capacidade=2)
    db_session.add(other)
    db_session.flush()

    assert room.checkin_token != other.checkin_token


def end_url(reservation: Reservation) -> str:
    return f"/api/v1/reservas/{reservation.id}/encerrar"


def test_ending_requires_login(client: TestClient, reservation: Reservation) -> None:
    response = client.post(end_url(reservation))

    assert (response.status_code, response.json()["code"]) == (401, "NAO_AUTENTICADO")


def test_check_in_then_end_frees_the_rest_of_the_slot(
    client: TestClient,
    *,
    headers: dict[str, str],
    clock: FixedClock,
    room: Resource,
    reservation: Reservation,
) -> None:
    url = f"{CHECKIN}/{room.checkin_token}"
    client.post(url, headers=headers)
    clock.current = at(14, 10)

    status = client.get(url, headers=headers).json()
    mine = client.get("/api/v1/reservas/minhas", headers=headers).json()["items"]
    ended = client.post(end_url(reservation), headers=headers)
    again = client.post(end_url(reservation), headers=headers)
    after = client.get(url, headers=headers).json()
    grid = client.get(
        f"/api/v1/recursos/{room.id}/disponibilidade",
        headers=headers,
        params={"data": WEDNESDAY.isoformat()},
    )
    receipt = client.get(f"/api/v1/reservas/comprovante/{reservation.codigo}", headers=headers)

    assert (status["situacao"], status["pode_encerrar"]) == ("FEITO", True)
    assert status["reserva"]["id"] == reservation.id
    assert [(item["id"], item["pode_encerrar"]) for item in mine] == [(reservation.id, True)]
    assert ended.status_code == 200, ended.text
    body = ended.json()
    assert datetime.fromisoformat(body["fim"]) == at(14, 30)
    assert datetime.fromisoformat(body["fim_previsto"]) == END
    assert datetime.fromisoformat(body["encerrada_em"]) == at(14, 10)
    assert (body["status"], body["pode_encerrar"], body["pode_cancelar"]) == (
        "CONFIRMADA",
        False,
        False,
    )
    assert (again.status_code, again.json()["code"]) == (409, "RESERVA_JA_ENCERRADA")
    assert "14:10" in again.json()["detail"]
    assert (after["situacao"], after["pode_encerrar"]) == ("ENCERRADA", False)
    slots = {
        datetime.fromisoformat(slot["inicio"]): slot["status"] for slot in grid.json()["slots"]
    }
    assert slots[at(14, 30)] == "LIVRE"
    assert datetime.fromisoformat(receipt.json()["encerrada_em"]) == at(14, 10)


def test_someone_else_cannot_end_and_unknown_is_404(
    client: TestClient,
    *,
    make_user: Callable[..., User],
    headers: dict[str, str],
    clock: FixedClock,
    reservation: Reservation,
) -> None:
    ana = make_user(email="ana@umj.edu.br", nome="Ana Souza")
    clock.current = at(14, 10)

    other = client.post(end_url(reservation), headers=login(client, ana.email))
    unknown = client.post("/api/v1/reservas/999999/encerrar", headers=headers)

    assert (other.status_code, other.json()["code"]) == (403, "ACESSO_NEGADO")
    assert (unknown.status_code, unknown.json()["code"]) == (404, "NAO_ENCONTRADO")


def test_ending_before_the_start_or_after_the_end_is_422(
    client: TestClient,
    *,
    db_session: Session,
    headers: dict[str, str],
    clock: FixedClock,
    reservation: Reservation,
) -> None:
    early = client.post(end_url(reservation), headers=headers)
    reservation.checkin_em = START
    db_session.flush()
    clock.current = END
    late = client.post(end_url(reservation), headers=headers)

    assert (early.status_code, early.json()["code"]) == (422, "RESERVA_NAO_INICIADA")
    assert (late.status_code, late.json()["code"]) == (422, "RESERVA_ENCERRADA")
