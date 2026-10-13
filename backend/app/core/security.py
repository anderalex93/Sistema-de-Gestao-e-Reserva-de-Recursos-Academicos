"""Hash de senha e emissão/validação de tokens JWT."""

from dataclasses import dataclass
from datetime import datetime, timedelta

import jwt
from pwdlib import PasswordHash

from app.core.clock import Clock
from app.core.enums import UserRole
from app.core.exceptions import UnauthorizedError

JWT_ALGORITHM = "HS256"


class InvalidTokenError(UnauthorizedError):
    code = "SESSAO_INVALIDA"
    default_detail = "Sua sessão expirou ou é inválida. Entre novamente."


class PasswordHasher:
    """Argon2 (recomendação atual da OWASP). A senha em texto nunca sai daqui."""

    def __init__(self, backend: PasswordHash | None = None) -> None:
        # `backend` só é trocado nos testes, por um Argon2 de custo mínimo.
        self._hasher = backend or PasswordHash.recommended()
        # Hash de referência para gastar o mesmo tempo quando o e-mail não existe.
        self._dummy_hash = self._hasher.hash("senha-inexistente-para-tempo-constante")

    def hash(self, password: str) -> str:
        return self._hasher.hash(password)

    def verify(self, password: str, password_hash: str | None) -> bool:
        if password_hash is None:
            self._hasher.verify(password, self._dummy_hash)
            return False
        return self._hasher.verify(password, password_hash)


@dataclass(frozen=True, slots=True)
class TokenClaims:
    user_id: int
    role: UserRole
    expires_at: datetime


@dataclass(frozen=True, slots=True)
class IssuedToken:
    value: str
    expires_in: int


class TokenService:
    def __init__(self, secret: str, expires_minutes: int, clock: Clock) -> None:
        self._secret = secret
        self._ttl = timedelta(minutes=expires_minutes)
        self._clock = clock

    def issue(self, user_id: int, role: UserRole) -> IssuedToken:
        now = self._clock.now()
        payload = {"sub": str(user_id), "perfil": role.value, "iat": now, "exp": now + self._ttl}
        token = jwt.encode(payload, self._secret, algorithm=JWT_ALGORITHM)
        return IssuedToken(value=token, expires_in=int(self._ttl.total_seconds()))

    def decode(self, token: str) -> TokenClaims:
        try:
            payload = jwt.decode(
                token,
                self._secret,
                algorithms=[JWT_ALGORITHM],
                options={"require": ["sub", "exp", "iat"], "verify_exp": False},
            )
            expires_at = datetime.fromtimestamp(payload["exp"], tz=self._clock.now().tzinfo)
            claims = TokenClaims(
                user_id=int(payload["sub"]),
                role=UserRole(payload["perfil"]),
                expires_at=expires_at,
            )
        except (jwt.PyJWTError, KeyError, ValueError) as exc:
            raise InvalidTokenError from exc
        # Expiração checada com o Clock injetado, para os testes controlarem o tempo.
        if claims.expires_at <= self._clock.now():
            raise InvalidTokenError
        return claims
