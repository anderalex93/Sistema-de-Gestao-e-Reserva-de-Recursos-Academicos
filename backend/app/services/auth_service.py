from app.core.exceptions import ForbiddenError, UnauthorizedError
from app.core.security import InvalidTokenError, PasswordHasher, TokenService
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.auth import LoginRequest, TokenRead
from app.schemas.user import UserRead


class InvalidCredentialsError(UnauthorizedError):
    code = "CREDENCIAIS_INVALIDAS"
    default_detail = "E-mail ou senha incorretos."


class InactiveUserError(ForbiddenError):
    code = "USUARIO_INATIVO"
    default_detail = "Esta conta está desativada. Procure a administração do campus."


class AuthService:
    def __init__(self, users: UserRepository, hasher: PasswordHasher, tokens: TokenService) -> None:
        self._users = users
        self._hasher = hasher
        self._tokens = tokens

    def login(self, data: LoginRequest) -> TokenRead:
        user = self._users.get_by_email(data.email)
        # Mesma mensagem e mesmo custo de hash para e-mail inexistente ou senha errada.
        password_ok = self._hasher.verify(data.senha, user.senha_hash if user else None)
        if user is None or not password_ok:
            raise InvalidCredentialsError
        if not user.ativo:
            raise InactiveUserError
        token = self._tokens.issue(user.id, user.perfil)
        return TokenRead(
            access_token=token.value,
            expires_in=token.expires_in,
            usuario=UserRead.model_validate(user),
        )

    def user_from_token(self, token: str) -> User:
        claims = self._tokens.decode(token)
        user = self._users.get(claims.user_id)
        if user is None or not user.ativo:
            raise InvalidTokenError
        return user
