import logging
from collections.abc import Iterator

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.core.config import Settings
from app.main import create_app
from tests.conftest import FAST_HASHER


def test_every_response_has_the_process_time_header(client: TestClient) -> None:
    response = client.get("/api/v1/health")

    assert float(response.headers["X-Process-Time"]) >= 0


def test_header_is_readable_by_the_frontend(client: TestClient) -> None:
    response = client.get("/api/v1/health", headers={"Origin": "http://localhost:5173"})

    assert "x-process-time" in response.headers["access-control-expose-headers"].lower()


@pytest.fixture
def slow_app(settings: Settings, db_session: Session) -> FastAPI:
    """Limite de 0 ms: toda requisição conta como lenta."""
    app = create_app(settings.model_copy(update={"slow_request_ms": 0.000_001}), FAST_HASHER)

    def override_get_db() -> Iterator[Session]:
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    return app


def test_slow_requests_are_logged_without_query_string(
    slow_app: FastAPI, caplog: pytest.LogCaptureFixture
) -> None:
    caplog.set_level(logging.WARNING, logger="app.performance")

    with TestClient(slow_app) as client:
        client.get("/api/v1/health", params={"busca": "maria@umj.edu.br"})

    assert "Slow request GET /api/v1/health" in caplog.text
    assert "maria" not in caplog.text
