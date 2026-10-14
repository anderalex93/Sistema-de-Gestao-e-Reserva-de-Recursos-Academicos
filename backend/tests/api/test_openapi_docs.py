"""O Swagger em /docs é a documentação da API (issue #37): toda operação explica o que faz e
documenta os erros que pode devolver."""

from typing import Any

import pytest

from app.core.config import Settings
from app.main import create_app
from app.services.catalog_service import IntervalInThePastError
from app.services.reservation_service import (
    ActiveLimitReachedError,
    CapacityExceededError,
    DurationExceededError,
    MisalignedIntervalError,
    OutsideOpeningHoursError,
    TooFarAheadError,
)

type Operation = dict[str, Any]

HTTP_METHODS = frozenset({"get", "post", "put", "patch", "delete"})

PUBLIC_OPERATIONS = {
    "GET /api/v1/health",
    "POST /api/v1/auth/cadastro",
    "POST /api/v1/auth/login",
    "GET /api/v1/config/regras",
    "GET /api/v1/reservas/comprovante/{codigo}",
}


@pytest.fixture(scope="module")
def schema(settings: Settings) -> dict[str, Any]:
    return create_app(settings).openapi()


@pytest.fixture(scope="module")
def operations(schema: dict[str, Any]) -> dict[str, Operation]:
    return {
        f"{method.upper()} {path}": operation
        for path, item in schema["paths"].items()
        for method, operation in item.items()
        if method in HTTP_METHODS
    }


def test_every_operation_has_summary_and_description(operations: dict[str, Operation]) -> None:
    missing = [
        name
        for name, operation in operations.items()
        if not operation.get("summary", "").strip() or not operation.get("description", "").strip()
    ]

    assert operations
    assert missing == []


def test_only_the_expected_operations_are_public(operations: dict[str, Operation]) -> None:
    public = {name for name, operation in operations.items() if "security" not in operation}

    assert public == PUBLIC_OPERATIONS


def test_every_authenticated_operation_documents_401(operations: dict[str, Operation]) -> None:
    missing = [
        name
        for name, operation in operations.items()
        if "security" in operation and "401" not in operation["responses"]
    ]

    assert missing == []


def test_public_receipt_does_not_document_401(operations: dict[str, Operation]) -> None:
    receipt = operations["GET /api/v1/reservas/comprovante/{codigo}"]

    assert "401" not in receipt["responses"]
    assert "429" in receipt["responses"]


def test_every_admin_operation_documents_403(operations: dict[str, Operation]) -> None:
    missing = [
        name
        for name, operation in operations.items()
        if "/api/v1/admin/" in name and "403" not in operation["responses"]
    ]

    assert missing == []


def test_error_responses_use_the_domain_error_format(operations: dict[str, Operation]) -> None:
    domain_error = "#/components/schemas/ErrorResponse"
    wrong = [
        f"{name} {status}"
        for name, operation in operations.items()
        for status, response in operation["responses"].items()
        if status in {"401", "403", "404", "409", "429", "503"}
        and response["content"]["application/json"]["schema"].get("$ref") != domain_error
    ]

    assert wrong == []


def test_create_reservation_documents_every_business_rule_code(
    operations: dict[str, Operation],
) -> None:
    rejected = operations["POST /api/v1/reservas"]["responses"]["422"]["description"]
    rules = [
        IntervalInThePastError,
        MisalignedIntervalError,
        OutsideOpeningHoursError,
        CapacityExceededError,
        DurationExceededError,
        TooFarAheadError,
        ActiveLimitReachedError,
    ]

    assert [rule.code for rule in rules if rule.code not in rejected] == []
    assert (
        "RESERVA_CONFLITO" in operations["POST /api/v1/reservas"]["responses"]["409"]["description"]
    )


@pytest.mark.parametrize(
    "model", ["UserSignup", "LoginRequest", "ReservationCreate", "ResourceCreate"]
)
def test_main_request_bodies_have_examples(schema: dict[str, Any], model: str) -> None:
    examples = schema["components"]["schemas"][model].get("examples", [])

    assert examples
    assert all("@" not in str(value) or "@umj.edu.br" in str(value) for value in examples)
