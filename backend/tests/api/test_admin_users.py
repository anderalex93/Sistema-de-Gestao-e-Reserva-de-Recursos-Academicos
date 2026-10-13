from collections.abc import Callable
from datetime import UTC, datetime, timedelta

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

USERS = "/api/v1/admin/usuarios"


@pytest.fixture
def admin_headers(client: TestClient, make_user: Callable[..., User]) -> dict[str, str]:
    make_user(email="admin@umj.edu.br", perfil=UserRole.ADMIN, nome="Admin")
    return login(client, "admin@umj.edu.br")


def test_admin_creates_account_with_chosen_role(
    client: TestClient, admin_headers: dict[str, str]
) -> None:
    response = client.post(
        USERS,
        headers=admin_headers,
        json={
            "nome": "Maria Professora",
            "email": "maria@umj.edu.br",
            "senha": "Senha123",
            "perfil": "PROFESSOR",
        },
    )

    assert response.status_code == 201
    assert response.json()["perfil"] == "PROFESSOR"
    assert login(client, "maria@umj.edu.br")


def test_admin_created_account_defaults_to_student(
    client: TestClient, admin_headers: dict[str, str]
) -> None:
    response = client.post(
        USERS,
        headers=admin_headers,
        json={"nome": "Ana Aluna", "email": "ana@umj.edu.br", "senha": "Senha123"},
    )

    assert response.json()["perfil"] == "ALUNO"


def test_admin_cannot_duplicate_email(client: TestClient, admin_headers: dict[str, str]) -> None:
    response = client.post(
        USERS,
        headers=admin_headers,
        json={"nome": "Outro", "email": "ADMIN@umj.edu.br", "senha": "Senha123"},
    )

    assert response.status_code == 409


def test_students_cannot_manage_users(client: TestClient, make_user: Callable[..., User]) -> None:
    make_user(email="lucas@umj.edu.br")
    headers = login(client, "lucas@umj.edu.br")

    create = client.post(
        USERS, headers=headers, json={"nome": "X Y Z", "email": "x@umj.edu.br", "senha": "Senha123"}
    )
    listing = client.get(USERS, headers=headers)

    assert (create.status_code, listing.status_code) == (403, 403)
    assert create.json()["code"] == "ACESSO_NEGADO"


def test_anonymous_cannot_manage_users(client: TestClient) -> None:
    assert client.get(USERS).status_code == 401


def test_list_is_paginated_and_searchable(
    client: TestClient, admin_headers: dict[str, str], make_user: Callable[..., User]
) -> None:
    for number in range(12):
        make_user(email=f"aluno{number:02d}@umj.edu.br", nome=f"Aluno {number:02d}")
    make_user(email="maria@umj.edu.br", nome="Maria 100% Presente")

    page = client.get(USERS, headers=admin_headers, params={"per_page": 5, "page": 2}).json()
    by_name = client.get(USERS, headers=admin_headers, params={"busca": "maria"}).json()
    literal_percent = client.get(USERS, headers=admin_headers, params={"busca": "100%"}).json()

    assert (page["total"], page["total_pages"], len(page["items"])) == (14, 3, 5)
    assert [user["email"] for user in by_name["items"]] == ["maria@umj.edu.br"]
    assert literal_percent["total"] == 1


def test_list_rejects_oversized_pages(client: TestClient, admin_headers: dict[str, str]) -> None:
    assert client.get(USERS, headers=admin_headers, params={"per_page": 500}).status_code == 422


def test_promotion_applies_on_next_request(
    client: TestClient, admin_headers: dict[str, str], make_user: Callable[..., User]
) -> None:
    student = make_user(email="monitor@umj.edu.br")
    student_headers = login(client, "monitor@umj.edu.br")

    response = client.patch(
        f"{USERS}/{student.id}", headers=admin_headers, json={"perfil": "PROFESSOR"}
    )

    assert (response.status_code, response.json()["perfil"]) == (200, "PROFESSOR")
    # O token antigo continua valendo e já enxerga o novo perfil.
    assert client.get("/api/v1/auth/me", headers=student_headers).json()["perfil"] == "PROFESSOR"


def test_promoted_to_admin_gains_access_with_old_token(
    client: TestClient, admin_headers: dict[str, str], make_user: Callable[..., User]
) -> None:
    student = make_user(email="novo.admin@umj.edu.br")
    student_headers = login(client, "novo.admin@umj.edu.br")
    assert client.get(USERS, headers=student_headers).status_code == 403

    client.patch(f"{USERS}/{student.id}", headers=admin_headers, json={"perfil": "ADMIN"})

    assert client.get(USERS, headers=student_headers).status_code == 200


def test_deactivated_account_loses_session_and_cannot_log_in(
    client: TestClient, admin_headers: dict[str, str], make_user: Callable[..., User]
) -> None:
    student = make_user(email="saiu@umj.edu.br")
    old_token = login(client, "saiu@umj.edu.br")

    response = client.patch(f"{USERS}/{student.id}", headers=admin_headers, json={"ativo": False})

    assert response.json()["ativo"] is False
    assert client.get("/api/v1/auth/me", headers=old_token).status_code == 401
    relogin = client.post(
        "/api/v1/auth/login", json={"email": "saiu@umj.edu.br", "senha": "Senha123"}
    )
    assert (relogin.status_code, relogin.json()["code"]) == (403, "USUARIO_INATIVO")


def test_reactivated_account_can_log_in_again(
    client: TestClient, admin_headers: dict[str, str], make_user: Callable[..., User]
) -> None:
    student = make_user(email="voltou@umj.edu.br", ativo=False)

    client.patch(f"{USERS}/{student.id}", headers=admin_headers, json={"ativo": True})

    assert login(client, "voltou@umj.edu.br")


def test_deactivation_cancels_only_future_reservations(
    client: TestClient,
    admin_headers: dict[str, str],
    make_user: Callable[..., User],
    db_session: Session,
) -> None:
    admin = db_session.scalars(select(User).where(User.email == "admin@umj.edu.br")).one()
    student = make_user(email="saiu@umj.edu.br")
    room = Resource(
        bloco=Building(nome="Bloco A"), nome="Sala 1", tipo=ResourceType.SALA_ESTUDO, capacidade=4
    )
    now = datetime.now(UTC).replace(microsecond=0)
    past, future = (
        Reservation(
            codigo=code,
            recurso=room,
            usuario_id=student.id,
            inicio=now + offset,
            fim=now + offset + timedelta(hours=1),
        )
        for code, offset in (("EDU-U00001", timedelta(days=-2)), ("EDU-U00002", timedelta(days=2)))
    )
    db_session.add_all([past, future])
    db_session.flush()

    client.patch(f"{USERS}/{student.id}", headers=admin_headers, json={"ativo": False})

    db_session.refresh(past)
    db_session.refresh(future)
    assert past.status is ReservationStatus.CONFIRMADA
    assert future.status is ReservationStatus.CANCELADA
    assert future.cancelada_por_id == admin.id
    assert future.motivo_cancelamento == "Conta desativada pela administração."


@pytest.mark.parametrize("change", [{"perfil": "PROFESSOR"}, {"ativo": False}])
def test_admin_cannot_lock_themselves_out(
    client: TestClient,
    admin_headers: dict[str, str],
    db_session: Session,
    change: dict[str, object],
) -> None:
    admin = db_session.scalars(select(User).where(User.email == "admin@umj.edu.br")).one()

    response = client.patch(f"{USERS}/{admin.id}", headers=admin_headers, json=change)

    assert (response.status_code, response.json()["code"]) == (422, "OPERACAO_NAO_PERMITIDA")
    assert (admin.perfil, admin.ativo) == (UserRole.ADMIN, True)


def test_admin_may_keep_own_role_and_demote_other_admins(
    client: TestClient,
    admin_headers: dict[str, str],
    db_session: Session,
    make_user: Callable[..., User],
) -> None:
    admin = db_session.scalars(select(User).where(User.email == "admin@umj.edu.br")).one()
    other = make_user(email="outro.admin@umj.edu.br", perfil=UserRole.ADMIN)

    same_role = client.patch(f"{USERS}/{admin.id}", headers=admin_headers, json={"perfil": "ADMIN"})
    demoted = client.patch(f"{USERS}/{other.id}", headers=admin_headers, json={"perfil": "ALUNO"})

    assert same_role.status_code == 200
    assert demoted.json()["perfil"] == "ALUNO"


@pytest.mark.parametrize(
    "payload", [{}, {"perfil": "REITOR"}, {"ativo": False, "email": "x@umj.edu.br"}]
)
def test_update_validates_payload(
    client: TestClient,
    admin_headers: dict[str, str],
    make_user: Callable[..., User],
    payload: dict[str, object],
) -> None:
    student = make_user(email="aluno@umj.edu.br")

    response = client.patch(f"{USERS}/{student.id}", headers=admin_headers, json=payload)

    assert response.status_code == 422


def test_update_unknown_user_is_404(client: TestClient, admin_headers: dict[str, str]) -> None:
    response = client.patch(f"{USERS}/99999", headers=admin_headers, json={"ativo": False})

    assert response.status_code == 404


@pytest.mark.parametrize("perfil", [UserRole.ALUNO, UserRole.PROFESSOR])
def test_non_admins_cannot_update_accounts(
    client: TestClient, make_user: Callable[..., User], perfil: UserRole
) -> None:
    target = make_user(email="alvo@umj.edu.br")
    make_user(email="quem@umj.edu.br", perfil=perfil)

    response = client.patch(
        f"{USERS}/{target.id}", headers=login(client, "quem@umj.edu.br"), json={"perfil": "ADMIN"}
    )

    assert (response.status_code, response.json()["code"]) == (403, "ACESSO_NEGADO")
