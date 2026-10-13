from typing import Any

from fastapi import APIRouter, Request

from app.api.dependencies import AuthServiceDep, CurrentUserDep, UserServiceDep
from app.core.rate_limit import LOGIN_LIMIT, SIGNUP_LIMIT, limiter
from app.models.user import User
from app.schemas.auth import LoginRequest, TokenRead
from app.schemas.errors import ErrorResponse
from app.schemas.user import UserRead, UserSignup

router = APIRouter(prefix="/auth", tags=["Autenticação"])

TOO_MANY: dict[int | str, dict[str, Any]] = {
    429: {"model": ErrorResponse, "description": "Muitas tentativas seguidas"}
}


@router.post(
    "/cadastro",
    status_code=201,
    summary="Cria a própria conta (perfil Aluno)",
    response_model=UserRead,
    responses={
        409: {"model": ErrorResponse, "description": "E-mail ou matrícula já cadastrados"},
        **TOO_MANY,
    },
)
@limiter.limit(SIGNUP_LIMIT)
def signup(request: Request, data: UserSignup, service: UserServiceDep) -> User:  # noqa: ARG001
    return service.register(data)


@router.post(
    "/login",
    summary="Entra com e-mail e senha e recebe o token de acesso",
    response_model=TokenRead,
    responses={
        401: {"model": ErrorResponse, "description": "E-mail ou senha incorretos"},
        403: {"model": ErrorResponse, "description": "Conta desativada"},
        **TOO_MANY,
    },
)
@limiter.limit(LOGIN_LIMIT)
def login(request: Request, data: LoginRequest, service: AuthServiceDep) -> TokenRead:  # noqa: ARG001
    return service.login(data)


@router.get(
    "/me",
    summary="Dados de quem está logado",
    response_model=UserRead,
    responses={401: {"model": ErrorResponse, "description": "Sem sessão válida"}},
)
def me(user: CurrentUserDep) -> User:
    return user
