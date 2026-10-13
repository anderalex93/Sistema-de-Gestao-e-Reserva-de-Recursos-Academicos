import re
from datetime import datetime
from typing import Annotated, Self

from pydantic import (
    AfterValidator,
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    StringConstraints,
    model_validator,
)

from app.core.enums import UserRole
from app.schemas.pagination import PageParams

PASSWORD_MIN_LENGTH = 8


def _check_password_strength(value: str) -> str:
    if not re.search(r"[A-Za-z]", value) or not re.search(r"\d", value):
        msg = "A senha precisa ter letras e números."
        raise ValueError(msg)
    return value


def _normalize_email(value: str) -> str:
    return value.strip().lower()


Name = Annotated[str, StringConstraints(strip_whitespace=True, min_length=3, max_length=120)]
Email = Annotated[EmailStr, AfterValidator(_normalize_email)]
Password = Annotated[
    str,
    Field(min_length=PASSWORD_MIN_LENGTH, max_length=128),
    AfterValidator(_check_password_strength),
]
Registration = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=20, pattern=r"^\w+$")
]


class UserSignup(BaseModel):
    """Autocadastro: o perfil é sempre ALUNO."""

    model_config = ConfigDict(extra="forbid")

    nome: Name
    email: Email
    senha: Password
    matricula: Registration | None = None


class UserAdminCreate(UserSignup):
    """Conta criada pelo administrador, que escolhe o perfil."""

    perfil: UserRole = UserRole.ALUNO


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nome: str
    email: str
    perfil: UserRole
    matricula: str | None
    ativo: bool
    criado_em: datetime


class UserSearchParams(PageParams):
    busca: str | None = Field(
        default=None, max_length=100, description="Trecho do nome, e-mail ou matrícula"
    )


class UserAdminUpdate(BaseModel):
    """Mudança parcial feita pelo admin: perfil, situação ou os dois."""

    model_config = ConfigDict(extra="forbid")

    perfil: UserRole | None = None
    ativo: bool | None = None

    @model_validator(mode="after")
    def _require_change(self) -> Self:
        if self.perfil is None and self.ativo is None:
            msg = "Informe o perfil ou a situação da conta."
            raise ValueError(msg)
        return self
