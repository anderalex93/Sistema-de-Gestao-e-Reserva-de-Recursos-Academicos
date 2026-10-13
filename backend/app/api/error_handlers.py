"""Converte exceções em respostas `{"detail", "code"}`.

Erros de validação do Pydantic mantêm o formato padrão do FastAPI.
"""

import logging
from typing import cast

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.exceptions import DomainError

logger = logging.getLogger(__name__)

HTTP_MESSAGES = {
    401: ("Faça login para continuar.", "NAO_AUTENTICADO"),
    403: ("Você não tem permissão para esta ação.", "ACESSO_NEGADO"),
    404: ("Endereço não encontrado.", "ROTA_NAO_ENCONTRADA"),
    405: ("Método não permitido neste endereço.", "METODO_NAO_PERMITIDO"),
}


def _error(status_code: int, detail: str, code: str) -> JSONResponse:
    return JSONResponse(status_code=status_code, content={"detail": detail, "code": code})


async def handle_domain_error(_request: Request, exc: Exception) -> JSONResponse:
    error = cast("DomainError", exc)
    return _error(error.status_code, error.detail, error.code)


async def handle_http_exception(_request: Request, exc: Exception) -> JSONResponse:
    error = cast("StarletteHTTPException", exc)
    detail, code = HTTP_MESSAGES.get(
        error.status_code, (str(error.detail), f"HTTP_{error.status_code}")
    )
    response = _error(error.status_code, detail, code)
    if error.headers:
        response.headers.update(error.headers)
    return response


async def handle_unexpected_error(request: Request, exc: Exception) -> JSONResponse:
    logger.exception(
        "Unhandled error on %s %s: %s", request.method, request.url.path, type(exc).__name__
    )
    return _error(500, "Erro interno. Tente novamente em instantes.", "ERRO_INTERNO")


def register_error_handlers(app: FastAPI) -> None:
    app.add_exception_handler(DomainError, handle_domain_error)
    app.add_exception_handler(StarletteHTTPException, handle_http_exception)
    app.add_exception_handler(Exception, handle_unexpected_error)
