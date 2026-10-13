from pydantic import BaseModel


class ErrorResponse(BaseModel):
    """Formato de todo erro de domínio. Usado nos `responses` dos endpoints para o OpenAPI."""

    detail: str
    code: str
