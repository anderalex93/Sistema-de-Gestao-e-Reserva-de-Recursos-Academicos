from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.user import Email, UserRead


class LoginRequest(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        json_schema_extra={
            "examples": [{"email": "ana.exemplo@umj.edu.br", "senha": "Estudo2026"}]
        },
    )

    email: Email
    senha: str = Field(min_length=1, max_length=128)


class TokenRead(BaseModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"  # noqa: S105 - tipo do token (RFC 6750), não senha
    expires_in: int = Field(description="Validade do token em segundos")
    usuario: UserRead
