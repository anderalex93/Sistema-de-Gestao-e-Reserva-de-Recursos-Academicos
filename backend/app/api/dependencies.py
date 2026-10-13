"""Providers de dependência. Montam sessão, repositórios e services para os endpoints."""

from collections.abc import Generator
from typing import Annotated

from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session, sessionmaker

from app.core.clock import Clock, SystemClock
from app.core.config import Settings
from app.core.enums import UserRole
from app.core.exceptions import ForbiddenError, UnauthorizedError
from app.core.security import PasswordHasher, TokenService
from app.db.unit_of_work import UnitOfWork
from app.models.user import User
from app.repositories.health_repository import HealthRepository
from app.repositories.user_repository import UserRepository
from app.services.auth_service import AuthService
from app.services.health_service import HealthService
from app.services.user_service import UserService

bearer_scheme = HTTPBearer(
    auto_error=False,
    description="Token de acesso obtido em `POST /api/v1/auth/login`.",
)


def get_settings_from_app(request: Request) -> Settings:
    settings: Settings = request.app.state.settings
    return settings


def get_db(request: Request) -> Generator[Session]:
    """Uma sessão por requisição. O commit é decisão explícita do service (UnitOfWork)."""
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


def get_password_hasher(request: Request) -> PasswordHasher:
    hasher: PasswordHasher = request.app.state.password_hasher
    return hasher


SettingsDep = Annotated[Settings, Depends(get_settings_from_app)]
SessionDep = Annotated[Session, Depends(get_db)]
ClockDep = Annotated[Clock, Depends(get_clock)]
PasswordHasherDep = Annotated[PasswordHasher, Depends(get_password_hasher)]


def get_token_service(settings: SettingsDep, clock: ClockDep) -> TokenService:
    return TokenService(
        secret=settings.jwt_secret.get_secret_value(),
        expires_minutes=settings.jwt_expires_minutes,
        clock=clock,
    )


def get_health_service(session: SessionDep) -> HealthService:
    return HealthService(HealthRepository(session))


def get_user_service(
    session: SessionDep, hasher: PasswordHasherDep, settings: SettingsDep
) -> UserService:
    return UserService(
        users=UserRepository(session),
        hasher=hasher,
        uow=UnitOfWork(session),
        allowed_email_domains=settings.allowed_email_domains,
    )


def get_auth_service(
    session: SessionDep,
    hasher: PasswordHasherDep,
    tokens: Annotated[TokenService, Depends(get_token_service)],
) -> AuthService:
    return AuthService(users=UserRepository(session), hasher=hasher, tokens=tokens)


HealthServiceDep = Annotated[HealthService, Depends(get_health_service)]
UserServiceDep = Annotated[UserService, Depends(get_user_service)]
AuthServiceDep = Annotated[AuthService, Depends(get_auth_service)]


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    auth: AuthServiceDep,
) -> User:
    if credentials is None:
        raise UnauthorizedError
    return auth.user_from_token(credentials.credentials)


CurrentUserDep = Annotated[User, Depends(get_current_user)]


def require_admin(user: CurrentUserDep) -> User:
    if user.perfil is not UserRole.ADMIN:
        raise ForbiddenError
    return user


AdminDep = Annotated[User, Depends(require_admin)]
