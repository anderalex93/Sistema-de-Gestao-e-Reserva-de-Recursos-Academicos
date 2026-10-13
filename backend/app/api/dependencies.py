"""Providers de dependência. Montam sessão, repositórios e services para os endpoints."""

from collections.abc import Generator
from typing import Annotated

from fastapi import Depends, Request
from sqlalchemy.orm import Session, sessionmaker

from app.core.clock import Clock, SystemClock
from app.core.config import Settings
from app.repositories.health_repository import HealthRepository
from app.services.health_service import HealthService


def get_settings_from_app(request: Request) -> Settings:
    settings: Settings = request.app.state.settings
    return settings


def get_db(request: Request) -> Generator[Session]:
    """Uma sessão por requisição. O commit é decisão explícita do service."""
    session_factory: sessionmaker[Session] = request.app.state.session_factory
    session = session_factory()
    try:
        yield session
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def get_clock() -> Clock:
    return SystemClock()


SettingsDep = Annotated[Settings, Depends(get_settings_from_app)]
SessionDep = Annotated[Session, Depends(get_db)]
ClockDep = Annotated[Clock, Depends(get_clock)]


def get_health_service(session: SessionDep) -> HealthService:
    return HealthService(HealthRepository(session))


HealthServiceDep = Annotated[HealthService, Depends(get_health_service)]
