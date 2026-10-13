from datetime import UTC, datetime, timedelta

import jwt
import pytest

from app.core.enums import UserRole
from app.core.security import InvalidTokenError, PasswordHasher, TokenService
from tests.conftest import FixedClock

SECRET = "segredo-de-teste-com-pelo-menos-32-bytes"


def test_hasher_verifies_only_the_right_password() -> None:
    hasher = PasswordHasher()
    hashed = hasher.hash("Senha123")

    assert hasher.verify("Senha123", hashed)
    assert not hasher.verify("Senha124", hashed)
    assert not hasher.verify("Senha123", None)


def test_token_round_trip() -> None:
    clock = FixedClock(datetime(2026, 10, 13, 12, tzinfo=UTC))
    tokens = TokenService(SECRET, 60, clock)

    issued = tokens.issue(42, UserRole.PROFESSOR)
    claims = tokens.decode(issued.value)

    assert issued.expires_in == 3600
    assert (claims.user_id, claims.role) == (42, UserRole.PROFESSOR)
    assert claims.expires_at == clock.current + timedelta(hours=1)


def test_token_expires() -> None:
    clock = FixedClock(datetime(2026, 10, 13, 12, tzinfo=UTC))
    tokens = TokenService(SECRET, 60, clock)
    issued = tokens.issue(42, UserRole.ALUNO)

    clock.current += timedelta(minutes=60)

    with pytest.raises(InvalidTokenError):
        tokens.decode(issued.value)


@pytest.mark.parametrize(
    "token",
    [
        jwt.encode(
            {"sub": "1", "perfil": "ALUNO", "iat": 0, "exp": 9_999_999_999},
            "outro-segredo-tambem-com-32-bytes-ou-mais",
        ),
        jwt.encode({"sub": "1", "perfil": "REI", "iat": 0, "exp": 9_999_999_999}, SECRET),
        jwt.encode({"perfil": "ALUNO", "iat": 0, "exp": 9_999_999_999}, SECRET),
        "lixo",
    ],
)
def test_rejects_invalid_tokens(token: str) -> None:
    tokens = TokenService(SECRET, 60, FixedClock(datetime(2026, 10, 13, tzinfo=UTC)))

    with pytest.raises(InvalidTokenError):
        tokens.decode(token)
