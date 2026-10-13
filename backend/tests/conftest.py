"""Fixtures compartilhadas.

O banco de teste é recriado a cada execução da suíte (schema `public` apagado e migrações
aplicadas do zero). Cada teste roda dentro de uma transação desfeita no final; `commit()` feito
pelos services vira um savepoint, então nada vaza entre testes.
"""

from collections.abc import Iterator
from pathlib import Path

import pytest
from alembic.config import Config
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import Connection, Engine, create_engine, make_url, text
from sqlalchemy.orm import Session

from alembic import command
from app.api.dependencies import get_db
from app.core.config import Settings
from app.main import create_app

BACKEND_DIR = Path(__file__).resolve().parents[1]


@pytest.fixture(scope="session")
def settings() -> Settings:
    base = Settings()
    if not base.test_database_url:
        pytest.exit("Defina TEST_DATABASE_URL no backend/.env ou no ambiente.", returncode=1)
    database = make_url(base.test_database_url).database or ""
    if not database.endswith("_test"):
        pytest.exit(
            "TEST_DATABASE_URL precisa apontar para um banco terminado em _test: "
            "a suíte apaga o schema inteiro antes de rodar.",
            returncode=1,
        )
    return base.model_copy(
        update={
            "database_url": base.test_database_url,
            "app_env": "test",
            "cors_origins": ["http://localhost:5173"],
        }
    )


@pytest.fixture(scope="session")
def alembic_config(settings: Settings) -> Config:
    config = Config(str(BACKEND_DIR / "alembic.ini"))
    config.set_main_option("sqlalchemy.url", settings.database_url.replace("%", "%%"))
    config.attributes["configure_logger"] = False
    return config


@pytest.fixture(scope="session")
def engine(settings: Settings, alembic_config: Config) -> Iterator[Engine]:
    engine = create_engine(settings.database_url)
    with engine.begin() as connection:
        connection.execute(text("DROP SCHEMA IF EXISTS public CASCADE"))
        connection.execute(text("CREATE SCHEMA public"))
    command.upgrade(alembic_config, "head")
    yield engine
    engine.dispose()


@pytest.fixture
def connection(engine: Engine) -> Iterator[Connection]:
    with engine.connect() as connection:
        transaction = connection.begin()
        yield connection
        transaction.rollback()


@pytest.fixture
def db_session(connection: Connection) -> Iterator[Session]:
    session = Session(
        bind=connection,
        join_transaction_mode="create_savepoint",
        autoflush=False,
        expire_on_commit=False,
    )
    yield session
    session.close()


@pytest.fixture
def app(settings: Settings, db_session: Session) -> FastAPI:
    app = create_app(settings)

    def override_get_db() -> Iterator[Session]:
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    return app


@pytest.fixture
def client(app: FastAPI) -> Iterator[TestClient]:
    with TestClient(app) as test_client:
        yield test_client
