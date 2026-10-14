"""Popula o banco: catálogo inicial do campus e administrador inicial.

O admin vem de SEED_ADMIN_NOME, SEED_ADMIN_EMAIL e SEED_ADMIN_SENHA.
Uso: `make seed` (ou `uv run python -m app.seed`). Pode rodar quantas vezes quiser.
Com `--volume` (`make seed-volume`), cria só a massa do teste de carga (#33).
Com `--demo` (`make seed-demo`), refaz as contas e reservas de demonstração (#38).
"""

import logging
import sys
from random import Random

from pydantic import ValidationError

from app.core.campus_schedule import CampusSchedule
from app.core.clock import SystemClock
from app.core.config import Settings, get_settings
from app.core.logging import configure_logging
from app.core.reservation_rules import ReservationRules
from app.core.security import PasswordHasher
from app.db import catalog_seed_data
from app.db.session import build_engine, build_session_factory
from app.db.unit_of_work import UnitOfWork
from app.repositories.building_repository import BuildingRepository
from app.repositories.feature_repository import FeatureRepository
from app.repositories.reservation_repository import ReservationRepository
from app.repositories.resource_repository import ResourceRepository
from app.repositories.user_repository import UserRepository
from app.services.admin_seeder import AdminSeeder
from app.services.catalog_seeder import CatalogSeeder
from app.services.demo_seeder import DemoSeeder
from app.services.user_service import UserService
from app.services.volume_seeder import VolumePlan, VolumeSeeder

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


def seed_volume(settings: Settings) -> int:
    """Massa para o teste de carga (#33). Nunca rode no banco de demonstração."""
    if settings.seed_volume_password is None:
        logger.error("Defina SEED_VOLUME_SENHA no backend/.env para criar as contas sintéticas.")
        return 1
    engine = build_engine(settings.database_url)
    try:
        with build_session_factory(engine)() as session:
            result = VolumeSeeder(
                buildings=BuildingRepository(session),
                resources=ResourceRepository(session),
                users=UserRepository(session),
                reservations=ReservationRepository(session),
                uow=UnitOfWork(session),
                schedule=CampusSchedule.from_settings(settings),
                clock=SystemClock(),
                rng=Random(33),  # noqa: S311 - massa de teste reprodutível, não criptografia
            ).run(
                VolumePlan(),
                PasswordHasher().hash(settings.seed_volume_password.get_secret_value()),
            )
    finally:
        engine.dispose()
    logger.info(
        "Volume: %s recursos, %s contas e %s reservas novas.",
        result.recursos,
        result.usuarios,
        result.reservas,
    )
    return 0


def seed_demo(settings: Settings) -> int:
    """Contas e reservas da apresentação (#38), relativas a hoje. Refaz o cenário a cada vez."""
    # Vazia conta como ausente: o .env.example traz `SEED_DEMO_SENHA=` em branco.
    if not settings.seed_demo_password:
        logger.error("Defina SEED_DEMO_SENHA no backend/.env para criar as contas de demonstração.")
        return 1
    engine = build_engine(settings.database_url)
    try:
        with build_session_factory(engine)() as session:
            result = DemoSeeder(
                resources=ResourceRepository(session),
                users=UserRepository(session),
                reservations=ReservationRepository(session),
                uow=UnitOfWork(session),
                hasher=PasswordHasher(),
                schedule=CampusSchedule.from_settings(settings),
                rules=ReservationRules.from_settings(settings),
                clock=SystemClock(),
                rng=Random(38),  # noqa: S311 - cenário reprodutível, não criptografia
            ).run(settings.seed_demo_password.get_secret_value(), catalog_seed_data.RESOURCES)
    finally:
        engine.dispose()
    by_status = ", ".join(
        f"{status.value}: {total}" for status, total in sorted(result.reservas_por_status.items())
    )
    logger.info(
        "Demonstração: %s contas novas e %s redefinidas, %s pessoas fictícias novas, "
        "%s reservas de demonstração removidas e %s criadas (%s).",
        result.contas_criadas,
        result.contas_redefinidas,
        result.pessoas_criadas,
        result.reservas_removidas,
        result.reservas,
        by_status or "nenhuma",
    )
    return 0


if __name__ == "__main__":
    settings = get_settings()
    configure_logging(settings.log_level)
    if "--volume" in sys.argv[1:]:
        sys.exit(seed_volume(settings))
    if "--demo" in sys.argv[1:]:
        sys.exit(seed_demo(settings))
    sys.exit(max(seed_catalog(settings), seed_admin(settings)))
