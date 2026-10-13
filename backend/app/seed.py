"""Popula o banco: catálogo inicial do campus e administrador inicial.

O admin vem de SEED_ADMIN_NOME, SEED_ADMIN_EMAIL e SEED_ADMIN_SENHA.
Uso: `make seed` (ou `uv run python -m app.seed`). Pode rodar quantas vezes quiser.
"""

import logging
import sys

from pydantic import ValidationError

from app.core.clock import SystemClock
from app.core.config import Settings, get_settings
from app.core.logging import configure_logging
from app.core.security import PasswordHasher
from app.db import catalog_seed_data
from app.db.session import build_engine, build_session_factory
from app.db.unit_of_work import UnitOfWork
from app.repositories.building_repository import BuildingRepository
from app.repositories.feature_repository import FeatureRepository
from app.repositories.resource_repository import ResourceRepository
from app.repositories.user_repository import UserRepository
from app.services.admin_seeder import AdminSeeder
from app.services.catalog_seeder import CatalogSeeder
from app.services.user_service import UserService

logger = logging.getLogger("app.seed")


def mask_email(email: str) -> str:
    """Mostra só o suficiente para conferir o e-mail no log (minimização, LGPD Art. 6º, III)."""
    local, _, domain = email.partition("@")
    return f"{local[:1]}***@{domain}"


def seed_catalog(settings: Settings) -> int:
    engine = build_engine(settings.database_url)
    try:
        with build_session_factory(engine)() as session:
            result = CatalogSeeder(
                BuildingRepository(session),
                FeatureRepository(session),
                ResourceRepository(session),
                UnitOfWork(session),
            ).run(
                catalog_seed_data.FEATURES,
                catalog_seed_data.BUILDINGS,
                catalog_seed_data.RESOURCES,
            )
    finally:
        engine.dispose()

    logger.info(
        "Catálogo: %s blocos, %s características e %s recursos novos.",
        result.blocos,
        result.caracteristicas,
        result.recursos,
    )
    return 0


def seed_admin(settings: Settings) -> int:
    if not settings.seed_admin_email or not settings.seed_admin_password:
        logger.error(
            "Defina SEED_ADMIN_EMAIL e SEED_ADMIN_SENHA no backend/.env para criar o admin."
        )
        return 1

    engine = build_engine(settings.database_url)
    try:
        with build_session_factory(engine)() as session:
            users = UserRepository(session)
            uow = UnitOfWork(session)
            service = UserService(
                users, PasswordHasher(), uow, settings.allowed_email_domains, SystemClock()
            )
            result = AdminSeeder(users, service, uow).run(
                nome=settings.seed_admin_name,
                email=settings.seed_admin_email,
                senha=settings.seed_admin_password.get_secret_value(),
            )
    except ValidationError as exc:
        problems = "; ".join(f"{'.'.join(map(str, e['loc']))}: {e['msg']}" for e in exc.errors())
        logger.error("Dados do admin inválidos (%s).", problems)
        return 1
    finally:
        engine.dispose()

    logger.info(
        "Administrador %s (id %s): %s.",
        mask_email(result.user.email),
        result.user.id,
        result.outcome,
    )
    return 0


if __name__ == "__main__":
    settings = get_settings()
    configure_logging(settings.log_level)
    sys.exit(max(seed_catalog(settings), seed_admin(settings)))
