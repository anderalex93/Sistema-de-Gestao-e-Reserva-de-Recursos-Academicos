from datetime import datetime

from sqlalchemy.exc import IntegrityError

from app.core.clock import Clock
from app.core.enums import UserRole
from app.core.exceptions import BusinessRuleError, ConflictError
from app.core.security import PasswordHasher
from app.db.unit_of_work import UnitOfWork
from app.models.user import User
from app.repositories.base import PageResult
from app.repositories.user_repository import UserRepository
from app.schemas.user import AccountData, UserAdminCreate, UserSignup


class EmailAlreadyRegisteredError(ConflictError):
    code = "EMAIL_JA_CADASTRADO"
    default_detail = "Este e-mail já possui conta. Entre ou recupere o acesso."


class RegistrationAlreadyUsedError(ConflictError):
    code = "MATRICULA_JA_CADASTRADA"
    default_detail = "Esta matrícula já está vinculada a outra conta."


class EmailDomainNotAllowedError(BusinessRuleError):
    code = "DOMINIO_NAO_PERMITIDO"
    default_detail = "Use o seu e-mail institucional para criar a conta."


class UserService:
    def __init__(
        self,
        users: UserRepository,
        hasher: PasswordHasher,
        uow: UnitOfWork,
        allowed_email_domains: list[str],
        clock: Clock,
    ) -> None:
        self._users = users
        self._hasher = hasher
        self._uow = uow
        self._allowed_domains = allowed_email_domains
        self._clock = clock

    def register(self, data: UserSignup) -> User:
        """Autocadastro. Respeita a restrição de domínio, se configurada, e grava o aceite."""
        self._ensure_domain_allowed(data.email)
        return self._create(data, UserRole.ALUNO, accepted_at=self._clock.now())

    def create_by_admin(self, data: UserAdminCreate) -> User:
        """Admin cria a conta de qualquer pessoa e define o perfil, sem restrição de domínio."""
        return self._create(data, data.perfil, accepted_at=None)

    def search(self, term: str | None, page: int, per_page: int) -> PageResult[User]:
        return self._users.search(term, page, per_page)

    def _ensure_domain_allowed(self, email: str) -> None:
        if not self._allowed_domains:
            return
        domain = email.rsplit("@", 1)[-1]
        if domain not in self._allowed_domains:
            raise EmailDomainNotAllowedError

    def _create(self, data: AccountData, role: UserRole, *, accepted_at: datetime | None) -> User:
        if self._users.email_exists(data.email):
            raise EmailAlreadyRegisteredError
        if data.matricula and self._users.registration_exists(data.matricula):
            raise RegistrationAlreadyUsedError
        user = User(
            nome=data.nome,
            email=data.email,
            senha_hash=self._hasher.hash(data.senha),
            perfil=role,
            matricula=data.matricula,
            aceite_termos_em=accepted_at,
        )
        try:
            self._users.add(user)
        except IntegrityError as exc:
            # Cadastro simultâneo com o mesmo e-mail ou matrícula: a constraint única decide.
            self._uow.rollback()
            raise EmailAlreadyRegisteredError from exc
        self._uow.commit()
        return user
