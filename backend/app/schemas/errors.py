from typing import Any

from pydantic import BaseModel


class ErrorResponse(BaseModel):
    """Formato de todo erro de domínio. Usado nos `responses` dos endpoints para o OpenAPI."""

    detail: str
    code: str


# Tipo de `responses=` do FastAPI, para declarar respostas reaproveitadas entre endpoints.
type ResponsesDoc = dict[int | str, dict[str, Any]]
