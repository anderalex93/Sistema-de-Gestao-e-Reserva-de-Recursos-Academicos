from collections.abc import Callable

import pytest
from fastapi.testclient import TestClient

from app.core.enums import UserRole
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
