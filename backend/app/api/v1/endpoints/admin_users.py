from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.api.dependencies import AdminDep, UserAdminServiceDep, UserServiceDep, require_admin
from app.models.user import User
from app.schemas.errors import ADMIN_ONLY, ErrorResponse
from app.schemas.pagination import Page
from app.schemas.user import UserAdminCreate, UserAdminUpdate, UserRead, UserSearchParams

router = APIRouter(
    prefix="/admin/usuarios",
    tags=["Administração"],
    dependencies=[Depends(require_admin)],
    responses=ADMIN_ONLY,
)


@router.post(
    "",
    status_code=201,
    summary="Cria a conta de um aluno, professor ou administrador",
    description=(
        "O administrador escolhe o perfil (padrão `ALUNO`) e não há restrição de domínio de "
        "e-mail. A pessoa aceita o Aviso de Privacidade e os Termos de Uso no primeiro acesso "
        "(`POST /api/v1/auth/me/aceite-termos`): o administrador não consente por ela. Senha "
        "com 8 a 128 caracteres, com letras e números."
    ),
    response_model=UserRead,
    responses={
        409: {
            "model": ErrorResponse,
            "description": (
                "E-mail (`EMAIL_JA_CADASTRADO`) ou matrícula (`MATRICULA_JA_CADASTRADA`) já "
                "cadastrados"
            ),
        }
    },
)
def create_user(data: UserAdminCreate, service: UserServiceDep) -> User:
    return service.create_by_admin(data)


@router.get(
    "",
    summary="Lista e busca usuários",
    description=(
        "Paginada e em ordem de nome, com contas ativas e desativadas. `busca` procura por "
        "trecho do nome, do e-mail ou da matrícula."
    ),
    response_model=Page[UserRead],
)
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
        422: {
            "model": ErrorResponse,
            "description": (
                "Admin tentando se rebaixar ou se desativar (`OPERACAO_NAO_PERMITIDA`) ou "
                "nenhum campo informado"
            ),
        },
    },
)
def update_user(
    user_id: int, data: UserAdminUpdate, admin: AdminDep, service: UserAdminServiceDep
) -> User:
    return service.update(user_id, data, admin)
