from collections.abc import Iterator

import pytest
from fastapi import APIRouter, FastAPI
from fastapi.testclient import TestClient
from pydantic import BaseModel

from app.core.config import Settings
from app.core.exceptions import (
    BusinessRuleError,
    ConflictError,
    DomainError,
    ForbiddenError,
    NotFoundError,
    ServiceUnavailableError,
    UnauthorizedError,
)
from app.main import create_app


class ReservationConflictError(ConflictError):
    code = "RESERVA_CONFLITO"
    default_detail = "Este horário acabou de ser reservado."


class Payload(BaseModel):
    quantidade: int


ERRORS: dict[str, DomainError] = {
    "base": DomainError(),
    "unauthorized": UnauthorizedError(),
    "forbidden": ForbiddenError(),
    "not-found": NotFoundError("Sala não encontrada."),
    "conflict": ConflictError(),
    "business": BusinessRuleError(),
    "unavailable": ServiceUnavailableError(),
    "custom": ReservationConflictError(),
}


@pytest.fixture
def error_app(settings: Settings) -> FastAPI:
    app = create_app(settings)
    router = APIRouter(prefix="/test")

    @router.get("/domain/{kind}")
    def raise_domain_error(kind: str) -> None:
        raise ERRORS[kind]

    @router.get("/unexpected")
    def raise_unexpected() -> None:
        msg = "segredo interno que não pode vazar"
        raise RuntimeError(msg)

    @router.post("/validation")
    def validate(payload: Payload) -> Payload:
        return payload

    app.include_router(router)
    return app


@pytest.fixture
def error_client(error_app: FastAPI) -> Iterator[TestClient]:
    with TestClient(error_app, raise_server_exceptions=False) as client:
        yield client


@pytest.mark.parametrize(
    ("kind", "status", "code", "detail"),
    [
        ("base", 400, "ERRO_DE_DOMINIO", "Não foi possível concluir a operação."),
        ("unauthorized", 401, "NAO_AUTENTICADO", "Faça login para continuar."),
        ("forbidden", 403, "ACESSO_NEGADO", "Você não tem permissão para esta ação."),
        ("not-found", 404, "NAO_ENCONTRADO", "Sala não encontrada."),
        ("conflict", 409, "CONFLITO", "A operação conflita com o estado atual dos dados."),
        ("business", 422, "REGRA_DE_NEGOCIO", "A operação não atende às regras do sistema."),
        ("unavailable", 503, "SERVICO_INDISPONIVEL", ServiceUnavailableError.default_detail),
        ("custom", 409, "RESERVA_CONFLITO", "Este horário acabou de ser reservado."),
    ],
)
def test_domain_errors_become_detail_and_code(
    error_client: TestClient, kind: str, status: int, code: str, detail: str
) -> None:
    response = error_client.get(f"/test/domain/{kind}")

    assert response.status_code == status
    assert response.json() == {"detail": detail, "code": code}


def test_unknown_route_uses_standard_format(error_client: TestClient) -> None:
    response = error_client.get("/nao-existe")

    assert response.status_code == 404
    assert response.json() == {"detail": "Endereço não encontrado.", "code": "ROTA_NAO_ENCONTRADA"}


def test_wrong_method_uses_standard_format(error_client: TestClient) -> None:
    response = error_client.delete("/api/v1/health")

    assert response.status_code == 405
    assert response.json()["code"] == "METODO_NAO_PERMITIDO"
    assert "GET" in response.headers["allow"]


def test_unexpected_error_returns_generic_500_without_leaking(error_client: TestClient) -> None:
    response = error_client.get("/test/unexpected")

    assert response.status_code == 500
    assert response.json() == {
        "detail": "Erro interno. Tente novamente em instantes.",
        "code": "ERRO_INTERNO",
    }
    assert "segredo" not in response.text


def test_validation_errors_keep_fastapi_format(error_client: TestClient) -> None:
    response = error_client.post("/test/validation", json={"quantidade": "muitos"})

    assert response.status_code == 422
    errors = response.json()["detail"]
    assert isinstance(errors, list)
    assert errors[0]["loc"] == ["body", "quantidade"]
