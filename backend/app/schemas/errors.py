from typing import Any

from pydantic import BaseModel


class ErrorResponse(BaseModel):
    """Formato de todo erro de domínio. Usado nos `responses` dos endpoints para o OpenAPI."""

    detail: str
    code: str


# Tipo de `responses=` do FastAPI, para declarar respostas reaproveitadas entre endpoints.
type ResponsesDoc = dict[int | str, dict[str, Any]]

# Toda rota que exige o token Bearer documenta o 401 com estes dois códigos.
UNAUTHORIZED: ResponsesDoc = {
    401: {
        "model": ErrorResponse,
        "description": (
            "Sem sessão válida: token ausente (`NAO_AUTENTICADO`) ou expirado, inválido ou de "
            "conta desativada (`SESSAO_INVALIDA`)"
        ),
    }
}

ADMIN_ONLY: ResponsesDoc = {
    **UNAUTHORIZED,
    403: {"model": ErrorResponse, "description": "Apenas administradores (`ACESSO_NEGADO`)"},
}

TOO_MANY_ATTEMPTS: ResponsesDoc = {
    429: {
        "model": ErrorResponse,
        "description": "Muitas tentativas seguidas do mesmo IP (`MUITAS_TENTATIVAS`)",
    }
}
