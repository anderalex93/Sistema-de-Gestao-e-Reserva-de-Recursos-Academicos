import logging
from collections.abc import Callable

import pytest
from pydantic import SecretStr
from sqlalchemy.orm import Session

from app.core.config import Settings
from app.core.enums import UserRole
from app.core.security import PasswordHasher
from app.db.unit_of_work import UnitOfWork
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.seed import mask_email, seed_admin
from app.services.admin_seeder import AdminSeeder, SeedOutcome
from app.services.user_service import UserService


@pytest.fixture
def seeder(db_session: Session, hasher: PasswordHasher) -> AdminSeeder:
    users = UserRepository(db_session)
    uow = UnitOfWork(db_session)
    return AdminSeeder(users, UserService(users, hasher, uow, []), uow)


def test_creates_admin(seeder: AdminSeeder, hasher: PasswordHasher) -> None:
    result = seeder.run("Admin", "Admin@UMJ.edu.br", "Senha123")

    assert result.outcome is SeedOutcome.CREATED
    assert result.user.perfil is UserRole.ADMIN
    assert result.user.email == "admin@umj.edu.br"
    assert hasher.verify("Senha123", result.user.senha_hash)


def test_is_idempotent_and_keeps_password(seeder: AdminSeeder, hasher: PasswordHasher) -> None:
    first = seeder.run("Admin", "admin@umj.edu.br", "Senha123")

    second = seeder.run("Admin", "admin@umj.edu.br", "OutraSenha456")

    assert second.outcome is SeedOutcome.UNCHANGED
    assert second.user.id == first.user.id
    assert hasher.verify("Senha123", second.user.senha_hash)


def test_promotes_existing_account(seeder: AdminSeeder, make_user: Callable[..., User]) -> None:
    existing = make_user(email="admin@umj.edu.br", ativo=False)

    result = seeder.run("Admin", "admin@umj.edu.br", "Senha123")

    assert result.outcome is SeedOutcome.PROMOTED
    assert (existing.perfil, existing.ativo) == (UserRole.ADMIN, True)


def test_enforces_password_policy(seeder: AdminSeeder) -> None:
    with pytest.raises(ValueError, match="letras e números"):
        seeder.run("Admin", "admin@umj.edu.br", "semnumeros")


def test_seed_script_requires_credentials(
    settings: Settings, caplog: pytest.LogCaptureFixture
) -> None:
    caplog.set_level(logging.ERROR)
    incomplete = settings.model_copy(update={"seed_admin_email": None})

    assert seed_admin(incomplete) == 1
    assert "SEED_ADMIN_EMAIL" in caplog.text


def test_seed_script_reports_invalid_password(
    settings: Settings, caplog: pytest.LogCaptureFixture
) -> None:
    caplog.set_level(logging.ERROR)
    weak = settings.model_copy(
        update={"seed_admin_email": "admin@umj.edu.br", "seed_admin_password": SecretStr("fraca")}
    )

    assert seed_admin(weak) == 1
    assert "senha" in caplog.text


def test_seed_log_masks_the_email() -> None:
    assert mask_email("admin@umj.edu.br") == "a***@umj.edu.br"
