from types import SimpleNamespace
from typing import cast

import pytest
from fastapi import Request
from fastapi.testclient import TestClient

from app.api.dependencies import get_clock, get_db, get_settings_from_app
from app.core.clock import SystemClock
from app.core.config import Settings
from app.main import create_app


class SessionSpy:
    def __init__(self) -> None:
        self.rolled_back = False
        self.closed = False

    def rollback(self) -> None:
        self.rolled_back = True

    def close(self) -> None:
        self.closed = True


def fake_request(session: SessionSpy, settings: Settings | None = None) -> Request:
    state = SimpleNamespace(session_factory=lambda: session, settings=settings)
    return cast("Request", SimpleNamespace(app=SimpleNamespace(state=state)))


def test_real_session_factory_serves_requests(settings: Settings) -> None:
    with TestClient(create_app(settings)) as client:
        response = client.get("/api/v1/health")

    assert response.json() == {"status": "ok", "db": "ok"}


def test_get_db_closes_session_after_request() -> None:
    session = SessionSpy()
    dependency = get_db(fake_request(session))

    yielded: object = next(dependency)
    assert yielded is session
    with pytest.raises(StopIteration):
        next(dependency)
    assert (session.rolled_back, session.closed) == (False, True)


def test_get_db_rolls_back_when_request_fails() -> None:
    session = SessionSpy()
    dependency = get_db(fake_request(session))
    next(dependency)

    with pytest.raises(RuntimeError):
        dependency.throw(RuntimeError("falha no service"))
    assert (session.rolled_back, session.closed) == (True, True)


def test_settings_and_clock_providers(settings: Settings) -> None:
    assert get_settings_from_app(fake_request(SessionSpy(), settings)) is settings
    assert isinstance(get_clock(), SystemClock)
