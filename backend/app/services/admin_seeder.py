from dataclasses import dataclass
from enum import StrEnum

from app.core.enums import UserRole
from app.db.unit_of_work import UnitOfWork
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserAdminCreate
from app.services.user_service import UserService


class SeedOutcome(StrEnum):
    CREATED = "criado"
    PROMOTED = "promovido a admin"
    UNCHANGED = "já existia"


@dataclass(frozen=True, slots=True)
class SeedResult:
    user: User
    outcome: SeedOutcome


class AdminSeeder:
    """Garante que existe um administrador.

    Idempotente: rodar de novo não duplica a conta nem troca a senha.
    """

    def __init__(self, users: UserRepository, user_service: UserService, uow: UnitOfWork) -> None:
        self._users = users
        self._user_service = user_service
        self._uow = uow

    def run(self, nome: str, email: str, senha: str) -> SeedResult:
        data = UserAdminCreate(nome=nome, email=email, senha=senha, perfil=UserRole.ADMIN)
        existing = self._users.get_by_email(data.email)
        if existing is None:
            return SeedResult(self._user_service.create_by_admin(data), SeedOutcome.CREATED)
        if existing.perfil is UserRole.ADMIN and existing.ativo:
            return SeedResult(existing, SeedOutcome.UNCHANGED)
        existing.perfil = UserRole.ADMIN
        existing.ativo = True
        self._uow.commit()
        return SeedResult(existing, SeedOutcome.PROMOTED)
