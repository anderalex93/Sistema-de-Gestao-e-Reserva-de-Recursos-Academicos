from collections.abc import Callable
from datetime import UTC, datetime, timedelta
from itertools import count

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.enums import ReservationStatus, ResourceType, UserRole
from app.models.building import Building
from app.models.reservation import Reservation
from app.models.resource import Resource
from app.models.user import User
from tests.conftest import login

SIGNUP = "/api/v1/auth/cadastro"
ME = "/api/v1/auth/me"
ACCEPT = "/api/v1/auth/me/aceite-termos"
EXPORT = "/api/v1/auth/me/dados"
DELETE = "/api/v1/auth/me/exclusao"


@pytest.fixture
def room(db_session: Session) -> Resource:
    resource = Resource(
        bloco=Building(nome="Bloco A"), nome="Sala 1", tipo=ResourceType.SALA_ESTUDO, capacidade=4
    )
    db_session.add(resource)
    db_session.flush()
    return resource


@pytest.fixture
def reserve(db_session: Session, room: Resource) -> Callable[..., Reservation]:
    codes = count(1)

    def factory(user: User, days: int) -> Reservation:
        start = datetime.now(UTC).replace(microsecond=0) + timedelta(days=days)
        reservation = Reservation(
            codigo=f"EDU-C{next(codes):05d}",
            recurso=room,
            usuario_id=user.id,
            inicio=start,
            fim=start + timedelta(hours=1),
            finalidade="Estudo",
        )
        db_session.add(reservation)
        db_session.flush()
        return reservation

    return factory


def signup_payload(**overrides: object) -> dict[str, object]:
    return {
        "nome": "Lucas Andrade",
        "email": "lucas@umj.edu.br",
        "senha": "Senha123",
        "aceite_termos": True,
        **overrides,
    }


@pytest.mark.parametrize("payload", [{"aceite_termos": False}, {"aceite_termos": None}])
def test_signup_is_impossible_without_acceptance(
    client: TestClient, payload: dict[str, object]
) -> None:
    response = client.post(
        SIGNUP,
        json={"nome": "Lucas Andrade", "email": "lucas@umj.edu.br", "senha": "Senha123", **payload},
    )
    missing = client.post(
        SIGNUP, json={"nome": "Lucas Andrade", "email": "lucas@umj.edu.br", "senha": "Senha123"}
    )

    assert (response.status_code, missing.status_code) == (422, 422)


def test_signup_records_acceptance_date(client: TestClient) -> None:
    before = datetime.now(UTC)

    response = client.post(SIGNUP, json=signup_payload())

    accepted = response.json()["aceite_termos_em"]
    assert accepted is not None
    assert datetime.fromisoformat(accepted) >= before - timedelta(seconds=1)


def test_admin_created_account_accepts_on_first_access(
    client: TestClient, make_user: Callable[..., User]
) -> None:
    make_user(email="admin@umj.edu.br", perfil=UserRole.ADMIN)
    created = client.post(
        "/api/v1/admin/usuarios",
        headers=login(client, "admin@umj.edu.br"),
        json={"nome": "Maria Souza", "email": "maria@umj.edu.br", "senha": "Senha123"},
    )
    assert created.json()["aceite_termos_em"] is None
    headers = login(client, "maria@umj.edu.br")

    first = client.post(ACCEPT, headers=headers).json()["aceite_termos_em"]
    again = client.post(ACCEPT, headers=headers).json()["aceite_termos_em"]

    assert first is not None
    # Aceitar de novo não muda a data: ela é a prova do consentimento.
    assert again == first
    assert client.get(ME, headers=headers).json()["aceite_termos_em"] == first


def test_export_has_account_and_every_reservation(
    client: TestClient,
    make_user: Callable[..., User],
    reserve: Callable[..., Reservation],
) -> None:
    lucas = make_user(email="lucas@umj.edu.br")
    other = make_user(email="ana@umj.edu.br")
    old, upcoming = reserve(lucas, -5), reserve(lucas, 3)
    reserve(other, 4)

    data = client.get(EXPORT, headers=login(client, lucas.email)).json()

    assert data["conta"]["email"] == "lucas@umj.edu.br"
    assert "senha_hash" not in data["conta"]
    assert [item["codigo"] for item in data["reservas"]] == [upcoming.codigo, old.codigo]
    assert data["reservas"][0] | {"inicio": None, "fim": None, "criado_em": None} == {
        "codigo": upcoming.codigo,
        "status": "CONFIRMADA",
        "recurso": "Sala 1",
        "bloco": "Bloco A",
        "inicio": None,
        "fim": None,
        "finalidade": "Estudo",
        "qtd_participantes": None,
        "criado_em": None,
        "cancelada_em": None,
        "motivo_cancelamento": None,
    }


def test_deletion_anonymizes_and_keeps_history_without_identity(
    client: TestClient,
    make_user: Callable[..., User],
    reserve: Callable[..., Reservation],
    db_session: Session,
) -> None:
    lucas = make_user(email="lucas@umj.edu.br", nome="Lucas Andrade")
    lucas.matricula = "2026104"
    past, future = reserve(lucas, -2), reserve(lucas, 2)
    headers = login(client, lucas.email)

    response = client.post(DELETE, headers=headers, json={"senha": "Senha123"})

    assert response.status_code == 204
    anonymized = db_session.scalars(select(User).where(User.id == lucas.id)).one()
    db_session.refresh(anonymized)
    assert (anonymized.nome, anonymized.email, anonymized.matricula, anonymized.ativo) == (
        "Conta excluída",
        f"excluida-{lucas.id}@eduspace.invalid",
        None,
        False,
    )
    db_session.refresh(past)
    db_session.refresh(future)
    assert past.status is ReservationStatus.CONFIRMADA
    assert future.status is ReservationStatus.CANCELADA
    assert future.motivo_cancelamento == "Conta excluída a pedido do titular."
    # Sessão derrubada, nada de login nem com a senha antiga.
    assert client.get(ME, headers=headers).status_code == 401
    relogin = client.post(
        "/api/v1/auth/login", json={"email": "lucas@umj.edu.br", "senha": "Senha123"}
    )
    assert relogin.status_code == 401
    # O e-mail fica livre para uma conta nova.
    assert client.post(SIGNUP, json=signup_payload()).status_code == 201


def test_deletion_requires_the_current_password(
    client: TestClient, make_user: Callable[..., User]
) -> None:
    lucas = make_user(email="lucas@umj.edu.br")

    response = client.post(DELETE, headers=login(client, lucas.email), json={"senha": "Errada123"})

    assert (response.status_code, response.json()["code"]) == (422, "SENHA_INCORRETA")
    assert lucas.ativo is True


def test_admin_cannot_delete_own_account(
    client: TestClient, make_user: Callable[..., User]
) -> None:
    admin = make_user(email="admin@umj.edu.br", perfil=UserRole.ADMIN)

    response = client.post(DELETE, headers=login(client, admin.email), json={"senha": "Senha123"})

    assert (response.status_code, response.json()["code"]) == (422, "OPERACAO_NAO_PERMITIDA")


@pytest.mark.parametrize(("method", "path"), [("POST", ACCEPT), ("GET", EXPORT), ("POST", DELETE)])
def test_account_endpoints_require_login(client: TestClient, method: str, path: str) -> None:
    assert client.request(method, path, json={"senha": "x"}).status_code == 401
