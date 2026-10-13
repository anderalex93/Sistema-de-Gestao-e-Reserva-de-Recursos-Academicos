from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import Session

from app.api.dependencies import get_health_service
from app.repositories.health_repository import HealthRepository
from app.services.health_service import HealthService


class UnreachableDatabaseRepository(HealthRepository):
    def ping(self) -> None:
        raise OperationalError("SELECT 1", {}, Exception("connection refused"))


def test_health_reports_api_and_database_ok(client: TestClient) -> None:
    response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "db": "ok"}


def test_health_returns_503_when_database_is_down(app: FastAPI, db_session: Session) -> None:
    app.dependency_overrides[get_health_service] = lambda: HealthService(
        UnreachableDatabaseRepository(db_session)
    )

    with TestClient(app) as client:
        response = client.get("/api/v1/health")

    assert response.status_code == 503
    body = response.json()
    assert body["code"] == "BANCO_INDISPONIVEL"
    assert "connection refused" not in body["detail"]


def test_openapi_documents_health_endpoint(client: TestClient) -> None:
    schema = client.get("/openapi.json").json()

    operation = schema["paths"]["/api/v1/health"]["get"]
    assert "503" in operation["responses"]
    assert client.get("/docs").status_code == 200
