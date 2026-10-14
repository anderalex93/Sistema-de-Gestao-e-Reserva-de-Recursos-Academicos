"""Recria do zero o banco usado pelos testes E2E do frontend (#35) e aplica o seed.

Uso: DATABASE_URL=...eduspace_e2e uv run python -m scripts.reset_e2e_database
Recusa qualquer banco que não termine em `_e2e`: o schema inteiro é apagado.
"""

import sys
from pathlib import Path

from alembic.config import Config
from sqlalchemy import create_engine, make_url, text

from alembic import command
from app.core.config import get_settings
from app.core.logging import configure_logging
from app.seed import seed_admin, seed_catalog

BACKEND_DIR = Path(__file__).resolve().parents[1]
REQUIRED_SUFFIX = "_e2e"


def create_database_if_missing(url: str) -> None:
    parsed = make_url(url)
    admin = create_engine(parsed.set(database="postgres"), isolation_level="AUTOCOMMIT")
    try:
        with admin.connect() as connection:
            exists = connection.scalar(
                text("SELECT 1 FROM pg_database WHERE datname = :name"),
                {"name": parsed.database},
            )
            if not exists:
                connection.execute(text(f'CREATE DATABASE "{parsed.database}"'))
    finally:
        admin.dispose()


def reset_schema(url: str) -> None:
    engine = create_engine(url)
    try:
        with engine.begin() as connection:
            connection.execute(text("DROP SCHEMA IF EXISTS public CASCADE"))
            connection.execute(text("CREATE SCHEMA public"))
    finally:
        engine.dispose()

    config = Config(str(BACKEND_DIR / "alembic.ini"))
    config.set_main_option("sqlalchemy.url", url.replace("%", "%%"))
    config.attributes["configure_logger"] = False
    command.upgrade(config, "head")


def main() -> int:
    settings = get_settings()
    configure_logging(settings.log_level)
    database = make_url(settings.database_url).database or ""
    if not database.endswith(REQUIRED_SUFFIX):
        print(  # noqa: T201 - script de linha de comando
            f"DATABASE_URL precisa apontar para um banco terminado em {REQUIRED_SUFFIX}.",
            file=sys.stderr,
        )
        return 1

    create_database_if_missing(settings.database_url)
    reset_schema(settings.database_url)
    admin = seed_admin(settings) if settings.seed_admin_email else 0
    return max(seed_catalog(settings), admin)


if __name__ == "__main__":
    sys.exit(main())
