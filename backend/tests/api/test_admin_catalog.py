from collections.abc import Callable
from datetime import UTC, datetime, timedelta
from itertools import count

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.enums import ReservationStatus, ResourceType, UserRole
from app.models.building import Building
from app.models.feature import Feature
from app.models.reservation import Reservation
from app.models.resource import Resource
from app.models.user import User
from tests.conftest import login

BUILDINGS = "/api/v1/admin/blocos"
RESOURCES = "/api/v1/admin/recursos"
FEATURES = "/api/v1/admin/caracteristicas"
SEARCH = "/api/v1/recursos"


@pytest.fixture
def admin(make_user: Callable[..., User]) -> User:
    return make_user(email="admin@umj.edu.br", perfil=UserRole.ADMIN, nome="Admin")


@pytest.fixture
def admin_headers(client: TestClient, admin: User) -> dict[str, str]:
    return login(client, admin.email)


@pytest.fixture
def student(make_user: Callable[..., User]) -> User:
    return make_user(email="lucas@umj.edu.br")


@pytest.fixture
def student_headers(client: TestClient, student: User) -> dict[str, str]:
    return login(client, student.email)


@pytest.fixture
def bloco(db_session: Session) -> Building:
    building = Building(nome="Bloco A")
    db_session.add(building)
    db_session.flush()
    return building


@pytest.fixture
def projetor(db_session: Session) -> Feature:
    feature = Feature(nome="Projetor")
    db_session.add(feature)
    db_session.flush()
    return feature


@pytest.fixture
def sala(db_session: Session, bloco: Building, projetor: Feature) -> Resource:
    resource = Resource(
        bloco=bloco,
        nome="Sala 101",
        tipo=ResourceType.SALA_ESTUDO,
        capacidade=6,
        caracteristicas=[projetor],
    )
    db_session.add(resource)
    db_session.flush()
    return resource


@pytest.fixture
def reserve(db_session: Session) -> Callable[..., Reservation]:
    """Reserva direto no banco, `days` dias a partir de agora (negativo para o passado)."""
    codes = count(1)

    def factory(resource: Resource, user: User, days: int) -> Reservation:
        start = datetime.now(UTC).replace(microsecond=0) + timedelta(days=days)
        reservation = Reservation(
            codigo=f"EDU-A{next(codes):05d}",
            recurso=resource,
            usuario_id=user.id,
            inicio=start,
            fim=start + timedelta(hours=1),
        )
        db_session.add(reservation)
        db_session.flush()
        return reservation

    return factory


def resource_payload(bloco_id: int, **overrides: object) -> dict[str, object]:
    return {
        "bloco_id": bloco_id,
        "tipo": "SALA_ESTUDO",
        "nome": "Sala 305",
        "capacidade": 8,
        "andar": "3º andar",
        "descricao": "Janelas para o pátio",
        "caracteristica_ids": [],
        **overrides,
    }


# Critério de aceite 1: sala nova aparece na busca dos alunos na hora.
def test_created_room_shows_up_in_student_search(
    client: TestClient,
    admin_headers: dict[str, str],
    student_headers: dict[str, str],
    bloco: Building,
    projetor: Feature,
) -> None:
    created = client.post(
        RESOURCES,
        headers=admin_headers,
        json=resource_payload(bloco.id, caracteristica_ids=[projetor.id, projetor.id]),
    )

    assert created.status_code == 201, created.text
    body = created.json()
    assert (body["nome"], body["ativo"], body["bloco"]["ativo"]) == ("Sala 305", True, True)
    assert [feature["nome"] for feature in body["caracteristicas"]] == ["Projetor"]
    search = client.get(SEARCH, headers=student_headers, params={"busca": "305"}).json()
    assert [item["id"] for item in search["items"]] == [body["id"]]


def test_update_replaces_every_field(
    client: TestClient, admin_headers: dict[str, str], sala: Resource, db_session: Session
) -> None:
    outro = Building(nome="Bloco B")
    db_session.add(outro)
    db_session.flush()

    response = client.put(
        f"{RESOURCES}/{sala.id}",
        headers=admin_headers,
        json=resource_payload(outro.id, nome="Laboratório 2", tipo="LABORATORIO", andar="  "),
    )

    body = response.json()
    assert response.status_code == 200, response.text
    assert (body["nome"], body["tipo"], body["bloco"]["nome"]) == (
        "Laboratório 2",
        "LABORATORIO",
        "Bloco B",
    )
    assert (body["andar"], body["caracteristicas"]) == (None, [])


def test_name_is_unique_per_building_ignoring_case(
    client: TestClient, admin_headers: dict[str, str], sala: Resource, db_session: Session
) -> None:
    outro = Building(nome="Bloco B")
    db_session.add(outro)
    db_session.flush()

    duplicate = client.post(
        RESOURCES, headers=admin_headers, json=resource_payload(sala.bloco_id, nome="sala 101")
    )
    other_building = client.post(
        RESOURCES, headers=admin_headers, json=resource_payload(outro.id, nome="Sala 101")
    )
    keep_own_name = client.put(
        f"{RESOURCES}/{sala.id}",
        headers=admin_headers,
        json=resource_payload(sala.bloco_id, nome="Sala 101"),
    )

    assert (duplicate.status_code, duplicate.json()["code"]) == (409, "RECURSO_JA_EXISTE")
    assert other_building.status_code == 201
    assert keep_own_name.status_code == 200


@pytest.mark.parametrize(
    ("overrides", "field"),
    [
        ({"capacidade": 0}, "capacidade"),
        ({"capacidade": None}, "body"),
        ({"nome": " "}, "nome"),
    ],
)
def test_validates_capacity_and_name(
    client: TestClient,
    admin_headers: dict[str, str],
    bloco: Building,
    overrides: dict[str, object],
    field: str,
) -> None:
    response = client.post(
        RESOURCES, headers=admin_headers, json=resource_payload(bloco.id, **overrides)
    )

    assert response.status_code == 422
    assert field in response.json()["detail"][0]["loc"]


def test_equipment_may_have_no_capacity(
    client: TestClient, admin_headers: dict[str, str], bloco: Building
) -> None:
    response = client.post(
        RESOURCES,
        headers=admin_headers,
        json=resource_payload(bloco.id, tipo="EQUIPAMENTO", nome="Projetor 03", capacidade=None),
    )

    assert response.status_code == 201
    assert response.json()["capacidade"] is None


def test_rejects_unknown_feature_and_inactive_building(
    client: TestClient, admin_headers: dict[str, str], bloco: Building, db_session: Session
) -> None:
    fechado = Building(nome="Bloco Z", ativo=False)
    db_session.add(fechado)
    db_session.flush()

    unknown_feature = client.post(
        RESOURCES, headers=admin_headers, json=resource_payload(bloco.id, caracteristica_ids=[999])
    )
    inactive = client.post(RESOURCES, headers=admin_headers, json=resource_payload(fechado.id))
    missing = client.post(RESOURCES, headers=admin_headers, json=resource_payload(99999))

    assert unknown_feature.json()["code"] == "CARACTERISTICA_INVALIDA"
    assert (inactive.status_code, inactive.json()["code"]) == (422, "BLOCO_INVALIDO")
    assert missing.json()["code"] == "BLOCO_INVALIDO"


def test_resource_in_inactive_building_can_still_be_edited(
    client: TestClient, admin_headers: dict[str, str], sala: Resource, bloco: Building
) -> None:
    bloco.ativo = False

    response = client.put(
        f"{RESOURCES}/{sala.id}",
        headers=admin_headers,
        json=resource_payload(bloco.id, nome="Sala 101 reformada"),
    )

    assert response.status_code == 200
    assert response.json()["bloco"]["ativo"] is False


def test_resource_without_history_is_deleted(
    client: TestClient, admin_headers: dict[str, str], sala: Resource, db_session: Session
) -> None:
    response = client.delete(f"{RESOURCES}/{sala.id}", headers=admin_headers)

    assert response.json() == {"resultado": "EXCLUIDO", "reservas_canceladas": 0}
    assert db_session.get(Resource, sala.id) is None
    assert client.get(f"{RESOURCES}/{sala.id}", headers=admin_headers).status_code == 404


# Critério de aceite 2: desativado some da busca, histórico continua.
def test_resource_with_history_is_deactivated_and_history_stays(
    client: TestClient,
    *,
    admin_headers: dict[str, str],
    student_headers: dict[str, str],
    student: User,
    sala: Resource,
    reserve: Callable[..., Reservation],
) -> None:
    past = reserve(sala, student, days=-3)

    response = client.delete(f"{RESOURCES}/{sala.id}", headers=admin_headers)

    assert response.json() == {"resultado": "DESATIVADO", "reservas_canceladas": 0}
    search = client.get(SEARCH, headers=student_headers).json()
    assert search["items"] == []
    assert client.get(f"{SEARCH}/{sala.id}", headers=student_headers).status_code == 404
    history = client.get(
        "/api/v1/reservas/minhas", headers=student_headers, params={"escopo": "historico"}
    ).json()
    assert [item["codigo"] for item in history["items"]] == [past.codigo]
    assert history["items"][0]["recurso"]["nome"] == "Sala 101"
    assert client.get(f"/api/v1/reservas/comprovante/{past.codigo}").status_code == 200


def test_deactivation_with_future_reservations_needs_confirmation(
    client: TestClient,
    *,
    admin_headers: dict[str, str],
    admin: User,
    student: User,
    sala: Resource,
    reserve: Callable[..., Reservation],
    db_session: Session,
) -> None:
    past = reserve(sala, student, days=-1)
    futures = [reserve(sala, student, days=days) for days in (2, 3)]

    refused = client.delete(f"{RESOURCES}/{sala.id}", headers=admin_headers)

    assert (refused.status_code, refused.json()["code"]) == (409, "RESERVAS_FUTURAS")
    assert "2 reservas futuras" in refused.json()["detail"]
    assert sala.ativo is True

    forced = client.delete(f"{RESOURCES}/{sala.id}?forcar=true", headers=admin_headers)

    assert forced.json() == {"resultado": "DESATIVADO", "reservas_canceladas": 2}
    for reservation in futures:
        db_session.refresh(reservation)
        assert reservation.status is ReservationStatus.CANCELADA
        assert reservation.cancelada_por_id == admin.id
        assert reservation.motivo_cancelamento == "Recurso desativado pela administração."
    db_session.refresh(past)
    assert past.status is ReservationStatus.CONFIRMADA


def test_single_future_reservation_message_is_singular(
    client: TestClient,
    admin_headers: dict[str, str],
    student: User,
    sala: Resource,
    reserve: Callable[..., Reservation],
) -> None:
    reserve(sala, student, days=1)

    refused = client.delete(f"{RESOURCES}/{sala.id}", headers=admin_headers)

    assert refused.json()["detail"].startswith("Há 1 reserva futura,")


def test_reactivated_resource_returns_to_search(
    client: TestClient,
    admin_headers: dict[str, str],
    student_headers: dict[str, str],
    sala: Resource,
) -> None:
    sala.ativo = False

    response = client.post(f"{RESOURCES}/{sala.id}/reativar", headers=admin_headers)

    assert response.json()["ativo"] is True
    assert client.get(SEARCH, headers=student_headers).json()["total"] == 1


def test_admin_list_includes_inactive_and_filters(
    client: TestClient, admin_headers: dict[str, str], sala: Resource, db_session: Session
) -> None:
    db_session.add(
        Resource(
            bloco=sala.bloco,
            nome="Sala em reforma",
            tipo=ResourceType.SALA_ESTUDO,
            capacidade=4,
            ativo=False,
        )
    )
    db_session.flush()

    every = client.get(RESOURCES, headers=admin_headers).json()
    inactive = client.get(RESOURCES, headers=admin_headers, params={"ativo": False}).json()
    by_name = client.get(RESOURCES, headers=admin_headers, params={"busca": "101"}).json()

    assert [item["nome"] for item in every["items"]] == ["Sala 101", "Sala em reforma"]
    assert [item["nome"] for item in inactive["items"]] == ["Sala em reforma"]
    assert [item["nome"] for item in by_name["items"]] == ["Sala 101"]


@pytest.mark.usefixtures("sala")
def test_building_crud_with_counts(client: TestClient, admin_headers: dict[str, str]) -> None:
    created = client.post(
        BUILDINGS, headers=admin_headers, json={"nome": "Bloco C", "descricao": " "}
    )
    duplicate = client.post(BUILDINGS, headers=admin_headers, json={"nome": "bloco a"})
    renamed = client.put(
        f"{BUILDINGS}/{created.json()['id']}",
        headers=admin_headers,
        json={"nome": "Bloco C (anexo)", "descricao": "Atrás da biblioteca"},
    )
    listing = client.get(BUILDINGS, headers=admin_headers).json()

    assert created.status_code == 201
    assert created.json()["descricao"] is None
    assert (duplicate.status_code, duplicate.json()["code"]) == (409, "BLOCO_JA_EXISTE")
    assert renamed.json()["descricao"] == "Atrás da biblioteca"
    assert [(item["nome"], item["total_recursos"]) for item in listing] == [
        ("Bloco A", 1),
        ("Bloco C (anexo)", 0),
    ]


def test_empty_building_is_deleted(
    client: TestClient, admin_headers: dict[str, str], db_session: Session
) -> None:
    vazio = Building(nome="Bloco vazio")
    db_session.add(vazio)
    db_session.flush()

    response = client.delete(f"{BUILDINGS}/{vazio.id}", headers=admin_headers)

    assert response.json()["resultado"] == "EXCLUIDO"
    assert db_session.get(Building, vazio.id) is None


def test_building_with_resources_is_deactivated_cancelling_future_reservations(
    client: TestClient,
    *,
    admin_headers: dict[str, str],
    student_headers: dict[str, str],
    student: User,
    sala: Resource,
    bloco: Building,
    reserve: Callable[..., Reservation],
) -> None:
    reserve(sala, student, days=2)

    refused = client.delete(f"{BUILDINGS}/{bloco.id}", headers=admin_headers)
    forced = client.delete(f"{BUILDINGS}/{bloco.id}?forcar=true", headers=admin_headers)

    assert refused.status_code == 409
    assert forced.json() == {"resultado": "DESATIVADO", "reservas_canceladas": 1}
    assert client.get(SEARCH, headers=student_headers).json()["total"] == 0
    assert client.get("/api/v1/blocos", headers=student_headers).json() == []
    # O recurso guarda o próprio estado: volta junto quando o bloco é reativado.
    assert sala.ativo is True
    reactivated = client.post(f"{BUILDINGS}/{bloco.id}/reativar", headers=admin_headers)
    assert reactivated.json()["ativo"] is True
    assert client.get(SEARCH, headers=student_headers).json()["total"] == 1


def test_feature_crud_detaches_from_resources(
    client: TestClient,
    admin_headers: dict[str, str],
    sala: Resource,
    projetor: Feature,
    db_session: Session,
) -> None:
    created = client.post(FEATURES, headers=admin_headers, json={"nome": "Lousa digital"})
    duplicate = client.post(FEATURES, headers=admin_headers, json={"nome": "PROJETOR"})
    renamed = client.put(
        f"{FEATURES}/{projetor.id}", headers=admin_headers, json={"nome": "Projetor HD"}
    )
    listing = client.get(FEATURES, headers=admin_headers).json()
    removed = client.delete(f"{FEATURES}/{projetor.id}", headers=admin_headers)

    assert created.status_code == 201
    assert (duplicate.status_code, duplicate.json()["code"]) == (409, "CARACTERISTICA_JA_EXISTE")
    assert renamed.json() == {"id": projetor.id, "nome": "Projetor HD", "total_recursos": 1}
    assert [(item["nome"], item["total_recursos"]) for item in listing] == [
        ("Lousa digital", 0),
        ("Projetor HD", 1),
    ]
    assert removed.status_code == 204
    assert db_session.scalar(select(Feature).where(Feature.id == projetor.id)) is None
    assert (
        client.get(f"{RESOURCES}/{sala.id}", headers=admin_headers).json()["caracteristicas"] == []
    )


@pytest.mark.parametrize(
    ("method", "path"),
    [
        ("GET", BUILDINGS),
        ("POST", BUILDINGS),
        ("PUT", f"{BUILDINGS}/1"),
        ("DELETE", f"{BUILDINGS}/1"),
        ("POST", f"{BUILDINGS}/1/reativar"),
        ("GET", RESOURCES),
        ("GET", f"{RESOURCES}/1"),
        ("POST", RESOURCES),
        ("PUT", f"{RESOURCES}/1"),
        ("DELETE", f"{RESOURCES}/1"),
        ("POST", f"{RESOURCES}/1/reativar"),
        ("GET", FEATURES),
        ("POST", FEATURES),
        ("PUT", f"{FEATURES}/1"),
        ("DELETE", f"{FEATURES}/1"),
    ],
)
# Critério de aceite 3: não-admin recebe 403 em todos os endpoints.
def test_non_admins_get_403_everywhere(
    client: TestClient, make_user: Callable[..., User], method: str, path: str
) -> None:
    make_user(email="prof@umj.edu.br", perfil=UserRole.PROFESSOR)
    make_user(email="aluno@umj.edu.br")

    for email in ("prof@umj.edu.br", "aluno@umj.edu.br"):
        response = client.request(method, path, headers=login(client, email), json={})
        assert (response.status_code, response.json()["code"]) == (403, "ACESSO_NEGADO")
    assert client.request(method, path, json={}).status_code == 401


def test_missing_entities_return_404(client: TestClient, admin_headers: dict[str, str]) -> None:
    responses = [
        client.put(f"{BUILDINGS}/999", headers=admin_headers, json={"nome": "X"}),
        client.delete(f"{BUILDINGS}/999", headers=admin_headers),
        client.post(f"{RESOURCES}/999/reativar", headers=admin_headers),
        client.put(f"{FEATURES}/999", headers=admin_headers, json={"nome": "Xis"}),
        client.delete(f"{FEATURES}/999", headers=admin_headers),
    ]

    assert {response.status_code for response in responses} == {404}
