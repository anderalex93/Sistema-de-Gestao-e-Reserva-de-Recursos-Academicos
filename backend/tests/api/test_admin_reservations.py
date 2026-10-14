from collections.abc import Callable
from datetime import UTC, date, datetime, time, timedelta
from itertools import count
from zoneinfo import ZoneInfo

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.enums import ReservationStatus, ResourceType, UserRole
from app.models.building import Building
from app.models.reservation import Reservation
from app.models.resource import Resource
from app.models.user import User
from tests.conftest import login

AGENDA = "/api/v1/admin/reservas"
CAMPUS = ZoneInfo("America/Maceio")
DAY = datetime.now(CAMPUS).date() + timedelta(days=3)


def at(day: date, hour: int) -> datetime:
    return datetime.combine(day, time(hour), tzinfo=CAMPUS).astimezone(UTC)


@pytest.fixture
def admin(make_user: Callable[..., User]) -> User:
    return make_user(email="admin@umj.edu.br", perfil=UserRole.ADMIN, nome="Admin")


@pytest.fixture
def admin_headers(client: TestClient, admin: User) -> dict[str, str]:
    return login(client, admin.email)


@pytest.fixture
def lucas(make_user: Callable[..., User]) -> User:
    return make_user(email="lucas@umj.edu.br", nome="Lucas Andrade")


@pytest.fixture
def rooms(db_session: Session) -> dict[str, Resource]:
    bloco_a, bloco_b = Building(nome="Bloco A"), Building(nome="Bloco B")
    found = {
        "a1": Resource(bloco=bloco_a, nome="Sala A1", tipo=ResourceType.SALA_ESTUDO, capacidade=4),
        "a2": Resource(bloco=bloco_a, nome="Sala A2", tipo=ResourceType.SALA_ESTUDO, capacidade=4),
        "b1": Resource(bloco=bloco_b, nome="Sala B1", tipo=ResourceType.SALA_ESTUDO, capacidade=4),
    }
    db_session.add_all(found.values())
    db_session.flush()
    return found


@pytest.fixture
def reserve(db_session: Session) -> Callable[..., Reservation]:
    codes = count(1)

    def factory(
        resource: Resource,
        user: User,
        start: datetime,
        status: ReservationStatus = ReservationStatus.CONFIRMADA,
    ) -> Reservation:
        cancelled = status is ReservationStatus.CANCELADA
        reservation = Reservation(
            codigo=f"EDU-G{next(codes):05d}",
            recurso=resource,
            usuario_id=user.id,
            inicio=start,
            fim=start + timedelta(hours=1),
            status=status,
            cancelada_em=start if cancelled else None,
        )
        db_session.add(reservation)
        db_session.flush()
        return reservation

    return factory


def test_agenda_lists_the_whole_day_grouped_with_holder(
    client: TestClient,
    admin_headers: dict[str, str],
    lucas: User,
    rooms: dict[str, Resource],
    reserve: Callable[..., Reservation],
) -> None:
    reserve(rooms["b1"], lucas, at(DAY, 9))
    reserve(rooms["a2"], lucas, at(DAY, 8))
    reserve(rooms["a1"], lucas, at(DAY, 14))
    reserve(rooms["a1"], lucas, at(DAY, 10), status=ReservationStatus.CANCELADA)
    reserve(rooms["a1"], lucas, at(DAY + timedelta(days=1), 10))

    page = client.get(AGENDA, headers=admin_headers, params={"data": DAY.isoformat()}).json()

    assert [(item["recurso"]["nome"], item["status"]) for item in page["items"]] == [
        ("Sala A1", "CANCELADA"),
        ("Sala A1", "CONFIRMADA"),
        ("Sala A2", "CONFIRMADA"),
        ("Sala B1", "CONFIRMADA"),
    ]
    assert page["items"][0]["usuario"] == {
        "id": lucas.id,
        "nome": "Lucas Andrade",
        "email": "lucas@umj.edu.br",
    }


def test_agenda_filters_by_building_resource_and_status(
    client: TestClient,
    admin_headers: dict[str, str],
    lucas: User,
    rooms: dict[str, Resource],
    reserve: Callable[..., Reservation],
) -> None:
    reserve(rooms["a1"], lucas, at(DAY, 9))
    reserve(rooms["a2"], lucas, at(DAY, 9), status=ReservationStatus.CANCELADA)
    reserve(rooms["b1"], lucas, at(DAY, 9))
    day = {"data": DAY.isoformat()}

    def names(params: dict[str, str | int]) -> list[str]:
        response = client.get(AGENDA, headers=admin_headers, params={**day, **params})
        return [item["recurso"]["nome"] for item in response.json()["items"]]

    assert names({"bloco_id": rooms["a1"].bloco_id}) == ["Sala A1", "Sala A2"]
    assert names({"recurso_id": rooms["b1"].id}) == ["Sala B1"]
    assert names({"status": "CONFIRMADA"}) == ["Sala A1", "Sala B1"]


def test_agenda_defaults_to_today(
    client: TestClient,
    admin_headers: dict[str, str],
    lucas: User,
    rooms: dict[str, Resource],
    reserve: Callable[..., Reservation],
) -> None:
    today = datetime.now(CAMPUS).date()
    reserve(rooms["a1"], lucas, at(today, 23))
    reserve(rooms["a1"], lucas, at(today + timedelta(days=1), 9))

    page = client.get(AGENDA, headers=admin_headers).json()

    assert page["total"] == 1


def test_admin_cancels_with_reason_and_owner_sees_it(
    client: TestClient,
    *,
    admin_headers: dict[str, str],
    admin: User,
    lucas: User,
    rooms: dict[str, Resource],
    reserve: Callable[..., Reservation],
) -> None:
    # Começa em 10 minutos: dentro do prazo em que o dono já não pode cancelar.
    soon = datetime.now(UTC).replace(microsecond=0) + timedelta(minutes=10)
    reservation = reserve(rooms["a1"], lucas, soon)

    response = client.post(
        f"{AGENDA}/{reservation.id}/cancelar",
        headers=admin_headers,
        json={"motivo": "  Manutenção do ar-condicionado  "},
    )

    body = response.json()
    assert response.status_code == 200, response.text
    assert body["status"] == "CANCELADA"
    assert body["motivo_cancelamento"] == "Manutenção do ar-condicionado"
    assert reservation.cancelada_por_id == admin.id
    history = client.get(
        "/api/v1/reservas/minhas",
        headers=login(client, lucas.email),
        params={"escopo": "historico"},
    ).json()
    assert history["items"][0]["motivo_cancelamento"] == "Manutenção do ar-condicionado"
    # O horário volta a ficar livre para outra reserva.
    reserve(rooms["a1"], admin, soon)


@pytest.mark.parametrize("motivo", ["", "    ", "abc", "x" * 301])
def test_reason_is_required(
    client: TestClient,
    *,
    admin_headers: dict[str, str],
    lucas: User,
    rooms: dict[str, Resource],
    reserve: Callable[..., Reservation],
    motivo: str,
) -> None:
    reservation = reserve(rooms["a1"], lucas, at(DAY, 9))

    response = client.post(
        f"{AGENDA}/{reservation.id}/cancelar", headers=admin_headers, json={"motivo": motivo}
    )

    assert response.status_code == 422


def test_cannot_cancel_ended_cancelled_or_missing_reservations(
    client: TestClient,
    admin_headers: dict[str, str],
    lucas: User,
    rooms: dict[str, Resource],
    reserve: Callable[..., Reservation],
) -> None:
    ended = reserve(rooms["a1"], lucas, datetime.now(UTC) - timedelta(hours=3))
    # Com check-in: sem ele, a reserva teria sido liberada por não comparecimento (#43).
    ended.checkin_em = ended.inicio
    cancelled = reserve(rooms["a2"], lucas, at(DAY, 9), status=ReservationStatus.CANCELADA)
    released = reserve(rooms["b1"], lucas, datetime.now(UTC) - timedelta(minutes=30))
    reason = {"motivo": "Evento institucional"}

    ended_response = client.post(
        f"{AGENDA}/{ended.id}/cancelar", headers=admin_headers, json=reason
    )
    cancelled_response = client.post(
        f"{AGENDA}/{cancelled.id}/cancelar", headers=admin_headers, json=reason
    )
    released_response = client.post(
        f"{AGENDA}/{released.id}/cancelar", headers=admin_headers, json=reason
    )
    missing = client.post(f"{AGENDA}/999999/cancelar", headers=admin_headers, json=reason)

    assert (ended_response.status_code, ended_response.json()["code"]) == (422, "RESERVA_ENCERRADA")
    assert (cancelled_response.status_code, cancelled_response.json()["code"]) == (
        409,
        "RESERVA_JA_CANCELADA",
    )
    assert (released_response.status_code, released_response.json()["code"]) == (
        409,
        "RESERVA_LIBERADA",
    )
    assert missing.status_code == 404


def test_admin_cannot_skip_the_reason_through_the_owner_endpoint(
    client: TestClient,
    admin_headers: dict[str, str],
    lucas: User,
    rooms: dict[str, Resource],
    reserve: Callable[..., Reservation],
) -> None:
    reservation = reserve(rooms["a1"], lucas, at(DAY, 9))

    response = client.post(f"/api/v1/reservas/{reservation.id}/cancelar", headers=admin_headers)

    assert (response.status_code, response.json()["code"]) == (403, "ACESSO_NEGADO")


@pytest.mark.parametrize("perfil", [UserRole.ALUNO, UserRole.PROFESSOR])
def test_non_admins_get_403(
    client: TestClient, make_user: Callable[..., User], perfil: UserRole
) -> None:
    make_user(email="quem@umj.edu.br", perfil=perfil)
    headers = login(client, "quem@umj.edu.br")

    listing = client.get(AGENDA, headers=headers)
    cancel = client.post(f"{AGENDA}/1/cancelar", headers=headers, json={"motivo": "Qualquer"})

    assert (listing.status_code, cancel.status_code) == (403, 403)
    assert client.get(AGENDA).status_code == 401
