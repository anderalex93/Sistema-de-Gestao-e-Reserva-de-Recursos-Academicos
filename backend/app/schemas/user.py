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


class AccountData(BaseModel):
    """Dados de uma conta nova, venha do autocadastro ou do administrador."""

    model_config = ConfigDict(extra="forbid")

    nome: Name
    email: Email
    senha: Password
    matricula: Registration | None = None


def _require_acceptance(value: bool) -> bool:
    if not value:
        msg = "Para criar a conta, leia e aceite o Aviso de Privacidade e os Termos de Uso."
        raise ValueError(msg)
    return value


class UserSignup(AccountData):
    """Autocadastro: o perfil é sempre ALUNO e o aceite é obrigatório (LGPD, Art. 8º e 9º)."""

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "nome": "Ana Exemplo Souza",
                    "email": "ana.exemplo@umj.edu.br",
                    "senha": "Estudo2026",
                    "matricula": "20261001",
                    "aceite_termos": True,
                }
            ]
        }
    )

    aceite_termos: Annotated[bool, AfterValidator(_require_acceptance)] = Field(
        description="Li e concordo com o Aviso de Privacidade e os Termos de Uso"
    )


class UserAdminCreate(AccountData):
    """Conta criada pelo administrador, que escolhe o perfil. A pessoa aceita os termos no
    primeiro acesso: o admin não pode consentir por ela."""

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "nome": "Carlos Exemplo Lima",
                    "email": "carlos.exemplo@umj.edu.br",
                    "senha": "Docente2026",
                    "matricula": None,
                    "perfil": "PROFESSOR",
                }
            ]
        }
    )

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
    aceite_termos_em: datetime | None = Field(
        description="Quando a pessoa aceitou os termos; vazio obriga o aceite no próximo acesso"
    )


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
