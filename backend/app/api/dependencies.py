"""Providers de dependência. Montam sessão, repositórios e services para os endpoints."""

from collections.abc import Generator
from typing import Annotated

from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session, sessionmaker

from app.core.campus_schedule import CampusSchedule
from app.core.clock import Clock, SystemClock
from app.core.config import Settings
from app.core.enums import UserRole
from app.core.exceptions import ForbiddenError, UnauthorizedError
from app.core.reservation_codes import CodeGenerator, RandomCodeGenerator
from app.core.reservation_rules import ReservationRules
from app.core.security import PasswordHasher, TokenService
from app.db.unit_of_work import UnitOfWork
from app.models.user import User
from app.repositories.building_repository import BuildingRepository
from app.repositories.feature_repository import FeatureRepository
from app.repositories.health_repository import HealthRepository
from app.repositories.reservation_repository import ReservationRepository
from app.repositories.resource_repository import ResourceRepository
from app.repositories.user_repository import UserRepository
from app.services.account_service import AccountService
from app.services.auth_service import AuthService
from app.services.availability_service import AvailabilityService
from app.services.board_service import BoardService
from app.services.building_admin_service import BuildingAdminService
from app.services.catalog_service import CatalogService
from app.services.checkin_service import CheckinService
from app.services.feature_admin_service import FeatureAdminService
from app.services.future_reservation_canceller import FutureReservationCanceller
from app.services.health_service import HealthService
from app.services.no_show_service import NoShowService
from app.services.reservation_service import ReservationService
from app.services.resource_admin_service import ResourceAdminService
from app.services.rules_service import RulesService
from app.services.user_admin_service import UserAdminService
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


def get_campus_schedule(settings: SettingsDep) -> CampusSchedule:
    return CampusSchedule.from_settings(settings)


CampusScheduleDep = Annotated[CampusSchedule, Depends(get_campus_schedule)]


def get_reservation_rules(settings: SettingsDep) -> ReservationRules:
    return ReservationRules.from_settings(settings)


ReservationRulesDep = Annotated[ReservationRules, Depends(get_reservation_rules)]


def get_token_service(settings: SettingsDep, clock: ClockDep) -> TokenService:
    return TokenService(
        secret=settings.jwt_secret.get_secret_value(),
        expires_minutes=settings.jwt_expires_minutes,
        clock=clock,
    )


def get_health_service(session: SessionDep) -> HealthService:
    return HealthService(HealthRepository(session))


def get_user_service(
    session: SessionDep, hasher: PasswordHasherDep, settings: SettingsDep, clock: ClockDep
) -> UserService:
    return UserService(
        users=UserRepository(session),
        hasher=hasher,
        uow=UnitOfWork(session),
        allowed_email_domains=settings.allowed_email_domains,
        clock=clock,
    )


def get_user_admin_service(session: SessionDep, clock: ClockDep) -> UserAdminService:
    return UserAdminService(
        users=UserRepository(session),
        canceller=FutureReservationCanceller(ReservationRepository(session), clock),
        uow=UnitOfWork(session),
    )


def get_account_service(
    session: SessionDep, hasher: PasswordHasherDep, clock: ClockDep
) -> AccountService:
    reservations = ReservationRepository(session)
    return AccountService(
        reservations=reservations,
        canceller=FutureReservationCanceller(reservations, clock),
        hasher=hasher,
        clock=clock,
        uow=UnitOfWork(session),
    )


def get_auth_service(
    session: SessionDep,
    hasher: PasswordHasherDep,
    tokens: Annotated[TokenService, Depends(get_token_service)],
) -> AuthService:
    return AuthService(users=UserRepository(session), hasher=hasher, tokens=tokens)


def get_catalog_service(session: SessionDep, clock: ClockDep) -> CatalogService:
    return CatalogService(
        buildings=BuildingRepository(session),
        features=FeatureRepository(session),
        resources=ResourceRepository(session),
        clock=clock,
    )


def get_availability_service(
    session: SessionDep, schedule: CampusScheduleDep, clock: ClockDep
) -> AvailabilityService:
    return AvailabilityService(
        resources=ResourceRepository(session),
        reservations=ReservationRepository(session),
        schedule=schedule,
        clock=clock,
    )


def get_board_service(session: SessionDep, schedule: CampusScheduleDep) -> BoardService:
    return BoardService(ResourceRepository(session), ReservationRepository(session), schedule)


def get_code_generator() -> CodeGenerator:
    return RandomCodeGenerator()


def get_reservation_service(
    session: SessionDep,
    schedule: CampusScheduleDep,
    clock: ClockDep,
    codes: Annotated[CodeGenerator, Depends(get_code_generator)],
    rules: ReservationRulesDep,
) -> ReservationService:
    return ReservationService(
        resources=ResourceRepository(session),
        reservations=ReservationRepository(session),
        uow=UnitOfWork(session),
        schedule=schedule,
        clock=clock,
        codes=codes,
        rules=rules,
    )


def get_no_show_service(
    session: SessionDep, clock: ClockDep, rules: ReservationRulesDep
) -> NoShowService:
    return NoShowService(
        reservations=ReservationRepository(session),
        uow=UnitOfWork(session),
        clock=clock,
        rules=rules,
    )


NoShowServiceDep = Annotated[NoShowService, Depends(get_no_show_service)]


def release_no_shows(service: NoShowServiceDep) -> None:
    """Liberação preguiçosa por não comparecimento (#43), sem worker: roda antes de cada rota
    que lê ou grava ocupação, então a reserva vencida é liberada na primeira leitura depois do
    prazo. O front consulta a grade a cada 10 s, então o horário aparece livre logo em seguida.
    """
    service.release_expired()


def get_checkin_service(
    session: SessionDep,
    no_shows: NoShowServiceDep,
    schedule: CampusScheduleDep,
    clock: ClockDep,
    rules: ReservationRulesDep,
) -> CheckinService:
    return CheckinService(
        resources=ResourceRepository(session),
        reservations=ReservationRepository(session),
        no_shows=no_shows,
        uow=UnitOfWork(session),
        schedule=schedule,
        clock=clock,
        rules=rules,
    )


def get_rules_service(schedule: CampusScheduleDep, rules: ReservationRulesDep) -> RulesService:
    return RulesService(schedule, rules)


def get_future_reservation_canceller(
    session: SessionDep, clock: ClockDep
) -> FutureReservationCanceller:
    return FutureReservationCanceller(ReservationRepository(session), clock)


CancellerDep = Annotated[FutureReservationCanceller, Depends(get_future_reservation_canceller)]


def get_building_admin_service(
    session: SessionDep, canceller: CancellerDep
) -> BuildingAdminService:
    return BuildingAdminService(
        buildings=BuildingRepository(session),
        resources=ResourceRepository(session),
        canceller=canceller,
        uow=UnitOfWork(session),
    )


def get_feature_admin_service(session: SessionDep) -> FeatureAdminService:
    return FeatureAdminService(FeatureRepository(session), UnitOfWork(session))


def get_resource_admin_service(
    session: SessionDep, canceller: CancellerDep
) -> ResourceAdminService:
    return ResourceAdminService(
        resources=ResourceRepository(session),
        buildings=BuildingRepository(session),
        features=FeatureRepository(session),
        reservations=ReservationRepository(session),
        canceller=canceller,
        uow=UnitOfWork(session),
    )


HealthServiceDep = Annotated[HealthService, Depends(get_health_service)]
UserServiceDep = Annotated[UserService, Depends(get_user_service)]
UserAdminServiceDep = Annotated[UserAdminService, Depends(get_user_admin_service)]
AccountServiceDep = Annotated[AccountService, Depends(get_account_service)]
AuthServiceDep = Annotated[AuthService, Depends(get_auth_service)]
CatalogServiceDep = Annotated[CatalogService, Depends(get_catalog_service)]
AvailabilityServiceDep = Annotated[AvailabilityService, Depends(get_availability_service)]
RulesServiceDep = Annotated[RulesService, Depends(get_rules_service)]
ReservationServiceDep = Annotated[ReservationService, Depends(get_reservation_service)]
CheckinServiceDep = Annotated[CheckinService, Depends(get_checkin_service)]
BoardServiceDep = Annotated[BoardService, Depends(get_board_service)]
BuildingAdminServiceDep = Annotated[BuildingAdminService, Depends(get_building_admin_service)]
FeatureAdminServiceDep = Annotated[FeatureAdminService, Depends(get_feature_admin_service)]
ResourceAdminServiceDep = Annotated[ResourceAdminService, Depends(get_resource_admin_service)]


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
