from collections.abc import Callable
from datetime import date, datetime, time
from itertools import count
from zoneinfo import ZoneInfo

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import event
from sqlalchemy.orm import Session

from app.core.enums import ReservationStatus, ResourceType, UserRole
from app.models.building import Building
from app.models.reservation import Reservation
from app.models.resource import Resource
from app.models.user import User
from tests.conftest import login

BOARD = "/api/v1/quadro"
MACEIO = ZoneInfo("America/Maceio")
WEDNESDAY = date(2030, 10, 23)


def at(hour: int, minute: int = 0) -> datetime:
    return datetime.combine(WEDNESDAY, time(hour, minute), tzinfo=MACEIO)


class Campus:
    def __init__(self, session: Session, owner: User) -> None:
        self.bloco_a = Building(nome="Bloco A")
        self.bloco_b = Building(nome="Bloco B")
        self.sala_a = Resource(
            bloco=self.bloco_a, nome="Sala A", tipo=ResourceType.SALA_ESTUDO, capacidade=4
        )
        self.lab_b = Resource(
            bloco=self.bloco_b, nome="Lab B", tipo=ResourceType.LABORATORIO, capacidade=20
        )
        self.inativa = Resource(
            bloco=self.bloco_a,
            nome="Sala inativa",
            tipo=ResourceType.SALA_ESTUDO,
            capacidade=4,
            ativo=False,
        )
        session.add_all([self.sala_a, self.lab_b, self.inativa])
        session.flush()
        codes = count(1)

        def reserve(
            resource: Resource, start: datetime, end: datetime, cancelled: bool = False
        ) -> None:
            session.add(
                Reservation(
                    codigo=f"EDU-Q{next(codes):05d}",
                    recurso_id=resource.id,
                    usuario_id=owner.id,
                    inicio=start,
                    fim=end,
                    status=ReservationStatus.CANCELADA
                    if cancelled
                    else ReservationStatus.CONFIRMADA,
                    cancelada_em=start if cancelled else None,
                )
            )

        reserve(self.sala_a, at(19), at(20))
        reserve(self.sala_a, at(9), at(10), cancelled=True)
        reserve(self.lab_b, at(8), at(9, 30))
        # Outro dia: não aparece.
        reserve(self.lab_b, at(8).replace(day=24), at(9).replace(day=24))
        session.flush()


@pytest.fixture
def owner(make_user: Callable[..., User]) -> User:
    return make_user(email="dona@umj.edu.br", nome="Maria Dona")


@pytest.fixture
def campus(db_session: Session, owner: User) -> Campus:
    return Campus(db_session, owner)


def board(client: TestClient, headers: dict[str, str], **params: str | int) -> dict[str, object]:
    response = client.get(BOARD, headers=headers, params={"data": str(WEDNESDAY), **params})
    assert response.status_code == 200, response.text
    body: dict[str, object] = response.json()
    return body


def rows(body: dict[str, object]) -> dict[str, list[dict[str, object]]]:
    lines = body["linhas"]
    assert isinstance(lines, list)
    return {line["recurso"]["nome"]: line["ocupacoes"] for line in lines}


def test_everyone_sees_what_is_taken_without_names(
    client: TestClient, campus: Campus, make_user: Callable[..., User]
) -> None:
    make_user(email="ana@umj.edu.br")
    body = board(client, login(client, "ana@umj.edu.br"))

    assert (body["abertura"], body["fechamento"]) == ("08:00:00", "21:00:00")
    by_name = rows(body)
    assert list(by_name) == ["Sala A", "Lab B"]
    assert by_name["Sala A"] == [
        {
            "inicio": "2030-10-23T22:00:00Z",
            "fim": "2030-10-23T23:00:00Z",
            "propria": False,
            "reservado_por": None,
        }
    ]
    assert len(by_name["Lab B"]) == 1
    assert campus


def test_owner_sees_own_reservations_and_admin_sees_names(
    client: TestClient, campus: Campus, owner: User, make_user: Callable[..., User]
) -> None:
    make_user(email="admin@umj.edu.br", perfil=UserRole.ADMIN)

    as_owner = rows(board(client, login(client, owner.email)))
    as_admin = rows(board(client, login(client, "admin@umj.edu.br")))

    assert as_owner["Sala A"][0]["propria"] is True
    assert as_admin["Sala A"][0]["reservado_por"] == "Maria Dona"
    assert campus


def test_filters_by_building_and_type(client: TestClient, campus: Campus, owner: User) -> None:
    headers = login(client, owner.email)

    assert list(rows(board(client, headers, bloco_id=campus.bloco_b.id))) == ["Lab B"]
    assert list(rows(board(client, headers, tipo="SALA_ESTUDO"))) == ["Sala A"]


def test_closed_day_is_empty(client: TestClient, campus: Campus, owner: User) -> None:
    body = board(client, login(client, owner.email), data="2030-10-27")

    assert body == {"data": "2030-10-27", "abertura": None, "fechamento": None, "linhas": []}
    assert campus


def test_uses_a_fixed_number_of_queries(
    client: TestClient, campus: Campus, owner: User, db_session: Session
) -> None:
    headers = login(client, owner.email)
    statements: list[str] = []

    def record(*args: object) -> None:
        statements.append(str(args[2]))

    engine = db_session.get_bind()
    event.listen(engine, "before_cursor_execute", record)
    try:
        board(client, headers)
    finally:
        event.remove(engine, "before_cursor_execute", record)

    reservation_queries = [sql for sql in statements if "FROM reserva" in sql]
    assert len(reservation_queries) == 1
    assert campus


def test_requires_login_and_a_date(client: TestClient, owner: User) -> None:
    assert client.get(BOARD, params={"data": str(WEDNESDAY)}).status_code == 401
    assert client.get(BOARD, headers=login(client, owner.email)).status_code == 422
