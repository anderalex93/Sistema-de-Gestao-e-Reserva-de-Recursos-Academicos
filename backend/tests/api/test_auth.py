from collections.abc import Callable
from datetime import UTC, datetime, timedelta
from typing import Any

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.api.dependencies import get_clock, get_db
from app.core.config import Settings
from app.core.enums import UserRole
from app.core.rate_limit import limiter
from app.main import create_app
from app.models.user import User
from tests.conftest import FAST_HASHER, FixedClock, login

SIGNUP = "/api/v1/auth/cadastro"
LOGIN = "/api/v1/auth/login"
ME = "/api/v1/auth/me"


def signup_payload(**overrides: Any) -> dict[str, Any]:
    return {
        "nome": "Lucas Andrade",
        "email": "lucas@gmail.com",
        "senha": "Senha123",
        "aceite_termos": True,
        **overrides,
    }


class TestSignup:
    def test_creates_student_account_with_any_email(self, client: TestClient) -> None:
        response = client.post(SIGNUP, json=signup_payload(email="  Lucas@Gmail.com "))

        assert response.status_code == 201
        body = response.json()
        assert body["email"] == "lucas@gmail.com"
        assert body["perfil"] == "ALUNO"
        assert body["ativo"] is True
        assert "senha" not in body
        assert "senha_hash" not in body

    def test_password_is_stored_hashed(self, client: TestClient, db_session: Session) -> None:
        client.post(SIGNUP, json=signup_payload())

        user = db_session.query(User).one()
        assert user.senha_hash != "Senha123"
        assert user.senha_hash.startswith("$argon2")

    def test_cannot_choose_own_role(self, client: TestClient) -> None:
        response = client.post(SIGNUP, json=signup_payload(perfil="ADMIN"))

        assert response.status_code == 422

    def test_duplicate_email_ignores_case(self, client: TestClient) -> None:
        client.post(SIGNUP, json=signup_payload())

        response = client.post(SIGNUP, json=signup_payload(email="LUCAS@gmail.com"))

        assert response.status_code == 409
        assert response.json()["code"] == "EMAIL_JA_CADASTRADO"

    def test_duplicate_registration_number(self, client: TestClient) -> None:
        client.post(SIGNUP, json=signup_payload(matricula="2024001"))

        response = client.post(
            SIGNUP, json=signup_payload(email="outra@gmail.com", matricula="2024001")
        )

        assert response.status_code == 409
        assert response.json()["code"] == "MATRICULA_JA_CADASTRADA"

    @pytest.mark.parametrize(
        ("field", "value"),
        [
            ("senha", "curta1"),
            ("senha", "somenteletras"),
            ("senha", "12345678"),
            ("email", "nao-e-email"),
            ("nome", "Lu"),
            ("matricula", "20 24"),
        ],
    )
    def test_rejects_invalid_data(self, client: TestClient, field: str, value: str) -> None:
        response = client.post(SIGNUP, json=signup_payload(**{field: value}))

        assert response.status_code == 422
        assert response.json()["detail"][0]["loc"][-1] == field

    def test_domain_restriction_when_configured(
        self, settings: Settings, db_session: Session
    ) -> None:
        restricted = create_app(
            settings.model_copy(update={"allowed_email_domains": ["umj.edu.br"]})
        )
        restricted.dependency_overrides[get_db] = lambda: db_session

        with TestClient(restricted) as client:
            blocked = client.post(SIGNUP, json=signup_payload(email="lucas@gmail.com"))
            allowed = client.post(SIGNUP, json=signup_payload(email="lucas@umj.edu.br"))

        assert blocked.status_code == 422
        assert blocked.json()["code"] == "DOMINIO_NAO_PERMITIDO"
        assert allowed.status_code == 201


class TestLogin:
    def test_returns_token_and_user(
        self, client: TestClient, make_user: Callable[..., User]
    ) -> None:
        make_user(email="lucas@umj.edu.br")

        response = client.post(LOGIN, json={"email": "LUCAS@umj.edu.br", "senha": "Senha123"})

        assert response.status_code == 200
        body = response.json()
        assert body["token_type"] == "bearer"
        assert body["expires_in"] == 480 * 60
        assert body["usuario"]["email"] == "lucas@umj.edu.br"

    @pytest.mark.parametrize(
        ("email", "senha"), [("lucas@umj.edu.br", "Errada123"), ("ninguem@umj.edu.br", "Senha123")]
    )
    def test_same_message_for_wrong_password_or_unknown_email(
        self, client: TestClient, make_user: Callable[..., User], email: str, senha: str
    ) -> None:
        make_user(email="lucas@umj.edu.br")

        response = client.post(LOGIN, json={"email": email, "senha": senha})

        assert response.status_code == 401
        assert response.json() == {
            "detail": "E-mail ou senha incorretos.",
            "code": "CREDENCIAIS_INVALIDAS",
        }

    def test_inactive_account(self, client: TestClient, make_user: Callable[..., User]) -> None:
        make_user(email="lucas@umj.edu.br", ativo=False)

        response = client.post(LOGIN, json={"email": "lucas@umj.edu.br", "senha": "Senha123"})

        assert response.status_code == 403
        assert response.json()["code"] == "USUARIO_INATIVO"


class TestMe:
    def test_returns_logged_user(self, client: TestClient, make_user: Callable[..., User]) -> None:
        make_user(email="lucas@umj.edu.br")

        response = client.get(ME, headers=login(client, "lucas@umj.edu.br"))

        assert response.status_code == 200
        assert response.json()["email"] == "lucas@umj.edu.br"

    def test_requires_token(self, client: TestClient) -> None:
        response = client.get(ME)

        assert response.status_code == 401
        assert response.json()["code"] == "NAO_AUTENTICADO"
        assert response.headers["www-authenticate"] == "Bearer"

    def test_rejects_tampered_token(self, client: TestClient) -> None:
        response = client.get(ME, headers={"Authorization": "Bearer nao.e.um.jwt"})

        assert response.status_code == 401
        assert response.json()["code"] == "SESSAO_INVALIDA"

    def test_rejects_token_of_deactivated_user(
        self, client: TestClient, make_user: Callable[..., User], db_session: Session
    ) -> None:
        user = make_user(email="lucas@umj.edu.br")
        headers = login(client, "lucas@umj.edu.br")
        user.ativo = False
        db_session.flush()

        assert client.get(ME, headers=headers).status_code == 401

    def test_rejects_expired_token(
        self, app: FastAPI, client: TestClient, make_user: Callable[..., User]
    ) -> None:
        make_user(email="lucas@umj.edu.br")
        clock = FixedClock(datetime(2026, 10, 13, 12, tzinfo=UTC))
        app.dependency_overrides[get_clock] = lambda: clock
        headers = login(client, "lucas@umj.edu.br")

        clock.current += timedelta(minutes=480)
        response = client.get(ME, headers=headers)

        assert response.status_code == 401
        assert response.json()["code"] == "SESSAO_INVALIDA"


def test_login_is_rate_limited(settings: Settings, db_session: Session) -> None:
    app = create_app(settings.model_copy(update={"rate_limit_enabled": True}), FAST_HASHER)
    app.dependency_overrides[get_db] = lambda: db_session
    limiter.reset()
    try:
        with TestClient(app) as client:
            statuses = [
                client.post(LOGIN, json={"email": "x@umj.edu.br", "senha": "Errada123"}).status_code
                for _ in range(21)
            ]
            blocked = client.post(LOGIN, json={"email": "x@umj.edu.br", "senha": "Errada123"})
    finally:
        limiter.reset()
        limiter.enabled = False

    assert set(statuses[:20]) == {401}
    assert blocked.status_code == 429
    assert blocked.json()["code"] == "MUITAS_TENTATIVAS"


def test_roles_are_exposed_in_openapi(client: TestClient) -> None:
    schema = client.get("/openapi.json").json()

    assert set(schema["components"]["schemas"]["UserRole"]["enum"]) == {r.value for r in UserRole}
    assert "HTTPBearer" in schema["components"]["securitySchemes"]
