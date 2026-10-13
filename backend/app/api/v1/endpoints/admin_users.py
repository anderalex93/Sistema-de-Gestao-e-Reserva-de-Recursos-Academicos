from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.api.dependencies import AdminDep, UserAdminServiceDep, UserServiceDep, require_admin
from app.models.user import User
from app.schemas.errors import ErrorResponse
from app.schemas.pagination import Page
from app.schemas.user import UserAdminCreate, UserAdminUpdate, UserRead, UserSearchParams

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


@router.patch(
    "/{user_id}",
    summary="Altera o perfil ou ativa e desativa uma conta",
    description=(
        "O novo perfil vale a partir do próximo acesso. Conta desativada perde a sessão na hora "
        "e as reservas dela que ainda não começaram são canceladas; o histórico continua. "
        "O admin não pode tirar o próprio acesso de administrador nem se desativar."
    ),
    response_model=UserRead,
    responses={
        404: {"model": ErrorResponse, "description": "Usuário inexistente"},
        422: {"model": ErrorResponse, "description": "Admin tentando se rebaixar ou se desativar"},
    },
)
def update_user(
    user_id: int, data: UserAdminUpdate, admin: AdminDep, service: UserAdminServiceDep
) -> User:
    return service.update(user_id, data, admin)
