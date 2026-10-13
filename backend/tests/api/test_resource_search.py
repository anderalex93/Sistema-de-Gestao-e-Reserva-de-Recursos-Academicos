from collections.abc import Callable
from datetime import UTC, datetime, timedelta
from itertools import count

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.enums import ReservationStatus, ResourceType
from app.models.building import Building
from app.models.feature import Feature
from app.models.reservation import Reservation
from app.models.resource import Resource
from app.models.user import User
from tests.conftest import login

RESOURCES = "/api/v1/recursos"
type Param = str | int | list[int]
NOW = datetime.now(UTC)
# Amanhã, 19h às 21h em Maceió (UTC-3). O relógio é o real porque o token também depende dele.
_TOMORROW = (NOW + timedelta(days=1)).replace(hour=22, minute=0, second=0, microsecond=0)
EVENING = (_TOMORROW, _TOMORROW + timedelta(hours=2))


@pytest.fixture
def owner(make_user: Callable[..., User]) -> User:
    return make_user(email="lucas@umj.edu.br")


@pytest.fixture
def headers(client: TestClient, owner: User) -> dict[str, str]:
    return login(client, owner.email)


class Campus:
    """Bloco A e B; projetor e ar; salas, laboratório e um equipamento."""

    def __init__(self, session: Session) -> None:
        self.bloco_a = Building(nome="Bloco A")
        self.bloco_b = Building(nome="Bloco B")
        self.projetor = Feature(nome="Projetor")
        self.ar = Feature(nome="Ar-condicionado")
        self.sala_a1 = self._resource("Sala A1", self.bloco_a, 4, [self.projetor, self.ar])
        self.sala_a2 = self._resource("Sala A2", self.bloco_a, 10, [self.projetor])
        self.sala_b1 = self._resource("Sala B1", self.bloco_b, 8, [self.projetor, self.ar])
        self.lab = self._resource(
            "Laboratório 1", self.bloco_b, 30, [self.ar], ResourceType.LABORATORIO
        )
        self.equipamento = Resource(
            bloco=self.bloco_a,
            nome="Projetor 01",
            tipo=ResourceType.EQUIPAMENTO,
            caracteristicas=[self.projetor],
        )
        session.add_all([self.sala_a1, self.sala_a2, self.sala_b1, self.lab, self.equipamento])
        session.flush()

    @staticmethod
    def _resource(
        nome: str,
        bloco: Building,
        capacidade: int,
        features: list[Feature],
        tipo: ResourceType = ResourceType.SALA_ESTUDO,
    ) -> Resource:
        return Resource(
            bloco=bloco, nome=nome, tipo=tipo, capacidade=capacidade, caracteristicas=features
        )


@pytest.fixture
def campus(db_session: Session) -> Campus:
    return Campus(db_session)


@pytest.fixture
def reserve(db_session: Session, owner: User) -> Callable[..., Reservation]:
    codes = count(1)

    def factory(
        resource: Resource,
        inicio: datetime,
        fim: datetime,
        status: ReservationStatus = ReservationStatus.CONFIRMADA,
    ) -> Reservation:
        reservation = Reservation(
            codigo=f"EDU-T{next(codes):05d}",
            recurso_id=resource.id,
            usuario_id=owner.id,
            inicio=inicio,
            fim=fim,
            status=status,
            cancelada_em=NOW if status is ReservationStatus.CANCELADA else None,
        )
        db_session.add(reservation)
        db_session.flush()
        return reservation

    return factory


def _names(client: TestClient, headers: dict[str, str], **params: Param) -> list[str]:
    response = client.get(RESOURCES, headers=headers, params=params)
    assert response.status_code == 200, response.text
    return [item["nome"] for item in response.json()["items"]]


def _window(**params: Param) -> dict[str, Param]:
    return {"inicio": EVENING[0].isoformat(), "fim": EVENING[1].isoformat(), **params}


def test_filters_by_building(client: TestClient, headers: dict[str, str], campus: Campus) -> None:
    assert _names(client, headers, bloco_id=campus.bloco_b.id) == ["Sala B1", "Laboratório 1"]


def test_filters_by_type(client: TestClient, headers: dict[str, str], campus: Campus) -> None:
    assert _names(client, headers, tipo="LABORATORIO") == ["Laboratório 1"]
    assert campus


def test_requires_every_selected_feature(
    client: TestClient, headers: dict[str, str], campus: Campus
) -> None:
    both = [campus.projetor.id, campus.ar.id]

    assert _names(client, headers, caracteristicas=both) == ["Sala A1", "Sala B1"]
    assert _names(client, headers, caracteristicas=[campus.ar.id]) == [
        "Sala A1",
        "Sala B1",
        "Laboratório 1",
    ]


def test_filters_by_minimum_capacity(
    client: TestClient, headers: dict[str, str], campus: Campus
) -> None:
    # Equipamento não tem lotação: sai da lista quando a capacidade é filtro.
    assert _names(client, headers, capacidade_min=8) == ["Sala A2", "Sala B1", "Laboratório 1"]
    assert campus


def test_searches_by_name(client: TestClient, headers: dict[str, str], campus: Campus) -> None:
    assert _names(client, headers, busca=" sala a") == ["Sala A1", "Sala A2"]
    assert _names(client, headers, busca="100%") == []
    assert campus


def test_combines_filters_like_the_user_journey(
    client: TestClient,
    headers: dict[str, str],
    campus: Campus,
    reserve: Callable[..., Reservation],
) -> None:
    """Bloco A + Projetor + amanhã 19h às 21h."""
    reserve(campus.sala_a2, EVENING[0] + timedelta(minutes=30), EVENING[1])

    names = _names(
        client,
        headers,
        **_window(bloco_id=campus.bloco_a.id, caracteristicas=[campus.projetor.id]),
    )

    assert names == ["Sala A1", "Projetor 01"]


@pytest.mark.parametrize(
    "case",
    [
        pytest.param((-60, 0, True), id="termina quando a busca começa"),
        pytest.param((120, 180, True), id="começa quando a busca termina"),
        pytest.param((-30, 30, False), id="invade o início"),
        pytest.param((90, 150, False), id="invade o fim"),
        pytest.param((30, 60, False), id="dentro do intervalo"),
        pytest.param((-60, 180, False), id="cobre o intervalo inteiro"),
    ],
)
def test_hides_resources_with_overlapping_reservations(
    client: TestClient,
    headers: dict[str, str],
    campus: Campus,
    reserve: Callable[..., Reservation],
    case: tuple[int, int, bool],
) -> None:
    """`case`: início e fim da reserva em minutos a partir das 19h, e se a sala aparece."""
    start, end, visible = case
    base = EVENING[0]
    reserve(campus.sala_a1, base + timedelta(minutes=start), base + timedelta(minutes=end))

    names = _names(client, headers, **_window(bloco_id=campus.bloco_a.id, tipo="SALA_ESTUDO"))

    assert ("Sala A1" in names) is visible
    assert "Sala A2" in names


def test_cancelled_reservations_free_the_slot(
    client: TestClient,
    headers: dict[str, str],
    campus: Campus,
    reserve: Callable[..., Reservation],
) -> None:
    reserve(campus.sala_a1, *EVENING, status=ReservationStatus.CANCELADA)

    assert "Sala A1" in _names(client, headers, **_window())


@pytest.mark.parametrize(
    "params",
    [
        {"inicio": EVENING[0].isoformat()},
        {"fim": EVENING[1].isoformat()},
        {"inicio": EVENING[1].isoformat(), "fim": EVENING[0].isoformat()},
        {"inicio": EVENING[0].isoformat(), "fim": EVENING[0].isoformat()},
        {"inicio": "2026-10-21T19:00:00", "fim": "2026-10-21T21:00:00"},
        {"tipo": "PISCINA"},
        {"capacidade_min": 0},
    ],
)
def test_rejects_invalid_filters(
    client: TestClient, headers: dict[str, str], params: dict[str, str]
) -> None:
    assert client.get(RESOURCES, headers=headers, params=params).status_code == 422


def test_rejects_intervals_in_the_past(client: TestClient, headers: dict[str, str]) -> None:
    started = {"inicio": (NOW - timedelta(minutes=30)).isoformat(), "fim": EVENING[1].isoformat()}

    response = client.get(RESOURCES, headers=headers, params=started)

    assert response.status_code == 422
    assert response.json()["code"] == "INTERVALO_NO_PASSADO"
