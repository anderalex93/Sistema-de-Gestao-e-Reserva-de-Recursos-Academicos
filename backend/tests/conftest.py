"""Fixtures compartilhadas.

O banco de teste é recriado a cada execução da suíte (schema `public` apagado e migrações
aplicadas do zero). Cada teste roda dentro de uma transação desfeita no final; `commit()` feito
pelos services vira um savepoint, então nada vaza entre testes.
"""

import os
from collections.abc import Callable, Iterator
from datetime import datetime
from pathlib import Path

import pytest
from alembic.config import Config
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pwdlib import PasswordHash
from pwdlib.hashers.argon2 import Argon2Hasher
from sqlalchemy import Connection, Engine, create_engine, make_url, text
from sqlalchemy.orm import Session

from alembic import command
from app.api.dependencies import get_db
from app.core.config import Settings
from app.core.enums import UserRole
from app.core.security import PasswordHasher
from app.main import create_app
from app.models.user import User

BACKEND_DIR = Path(__file__).resolve().parents[1]


def _worker_database_url(url: str) -> str:
    """Com pytest-xdist, cada worker usa o próprio banco (`eduspace_gw0_test`...) e o cria se
    preciso. Sem xdist, usa o banco configurado. Assim os workers nunca apagam o schema um
    do outro."""
    worker = os.environ.get("PYTEST_XDIST_WORKER")
    parsed = make_url(url)
    if not worker:
        return url
    base = (parsed.database or "").removesuffix("_test")
    database = f"{base}_{worker}_test"
    admin = create_engine(parsed.set(database="postgres"), isolation_level="AUTOCOMMIT")
    try:
        with admin.connect() as connection:
            exists = connection.scalar(
                text("SELECT 1 FROM pg_database WHERE datname = :name"), {"name": database}
            )
            if not exists:
                connection.execute(text(f'CREATE DATABASE "{database}"'))
    finally:
        admin.dispose()
    return parsed.set(database=database).render_as_string(hide_password=False)


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
            "database_url": _worker_database_url(base.test_database_url),
            "app_env": "test",
            "cors_origins": ["http://localhost:5173"],
            "allowed_email_domains": [],
            "rate_limit_enabled": False,
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
    app = create_app(settings, FAST_HASHER)

    def override_get_db() -> Iterator[Session]:
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    return app


@pytest.fixture
def client(app: FastAPI) -> Iterator[TestClient]:
    with TestClient(app) as test_client:
        yield test_client


class FixedClock:
    """Relógio controlável nos testes."""

    def __init__(self, now: datetime) -> None:
        self.current = now

    def now(self) -> datetime:
        return self.current


# Argon2 de custo mínimo: mesmo algoritmo, sem os ~100 ms por hash que a produção usa de propósito.
FAST_HASHER = PasswordHasher(
    PasswordHash((Argon2Hasher(time_cost=1, memory_cost=1024, parallelism=1),))
)


@pytest.fixture
def hasher() -> PasswordHasher:
    return FAST_HASHER


@pytest.fixture
def make_user(db_session: Session, hasher: PasswordHasher) -> Callable[..., User]:
    """Cria usuários direto no banco. Senha padrão: `Senha123`."""

    def factory(
        email: str = "lucas@umj.edu.br",
        perfil: UserRole = UserRole.ALUNO,
        senha: str = "Senha123",
        nome: str = "Lucas Andrade",
        ativo: bool = True,
    ) -> User:
        user = User(
            nome=nome, email=email, senha_hash=hasher.hash(senha), perfil=perfil, ativo=ativo
        )
        db_session.add(user)
        db_session.flush()
        return user

    return factory


def login(client: TestClient, email: str, senha: str = "Senha123") -> dict[str, str]:
    response = client.post("/api/v1/auth/login", json={"email": email, "senha": senha})
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}
