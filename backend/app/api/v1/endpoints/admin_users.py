from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.api.dependencies import UserServiceDep, require_admin
from app.models.user import User
from app.schemas.errors import ErrorResponse
from app.schemas.pagination import Page
from app.schemas.user import UserAdminCreate, UserRead, UserSearchParams

router = APIRouter(
    prefix="/admin/usuarios",
    tags=["Administração"],
    dependencies=[Depends(require_admin)],
    responses={
        401: {"model": ErrorResponse, "description": "Sem sessão válida"},
        403: {"model": ErrorResponse, "description": "Apenas administradores"},
    },
)


@router.post(
    "",
    status_code=201,
    summary="Cria a conta de um aluno, professor ou administrador",
    response_model=UserRead,
    responses={409: {"model": ErrorResponse, "description": "E-mail ou matrícula já cadastrados"}},
)
def create_user(data: UserAdminCreate, service: UserServiceDep) -> User:
    return service.create_by_admin(data)


@router.get("", summary="Lista e busca usuários", response_model=Page[UserRead])
def list_users(
    service: UserServiceDep, params: Annotated[UserSearchParams, Query()]
) -> Page[UserRead]:
    return Page[UserRead].model_validate(service.search(params.busca, params.page, params.per_page))
