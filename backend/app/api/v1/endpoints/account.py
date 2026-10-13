from fastapi import APIRouter, Request

from app.api.dependencies import AccountServiceDep, CurrentUserDep
from app.core.rate_limit import LOGIN_LIMIT, limiter
from app.models.user import User
from app.schemas.account import AccountDeletion, MyDataExport
from app.schemas.errors import ErrorResponse
from app.schemas.user import UserRead

router = APIRouter(
    prefix="/auth/me",
    tags=["Minha conta"],
    responses={401: {"model": ErrorResponse, "description": "Sem sessão válida"}},
)


@router.post(
    "/aceite-termos",
    summary="Registra o aceite do Aviso de Privacidade e dos Termos de Uso",
    description="Para contas criadas pelo administrador, no primeiro acesso.",
    response_model=UserRead,
)
def accept_terms(user: CurrentUserDep, service: AccountServiceDep) -> User:
    return service.accept_terms(user)


@router.get(
    "/dados",
    summary="Exporta todos os meus dados em JSON (LGPD, Art. 18)",
    response_model=MyDataExport,
)
def export_my_data(user: CurrentUserDep, service: AccountServiceDep) -> MyDataExport:
    return service.export(user)


@router.post(
    "/exclusao",
    status_code=204,
    summary="Exclui a minha conta (LGPD, Art. 18, VI)",
    description=(
        "Pede a senha atual. A conta é anonimizada e desativada: nome, e-mail e matrícula somem, "
        "as reservas antigas ficam no histórico do espaço sem identificar ninguém e as futuras "
        "são canceladas. Administradores não podem se excluir por aqui."
    ),
    responses={
        422: {"model": ErrorResponse, "description": "Senha incorreta ou conta de administrador"},
        429: {"model": ErrorResponse, "description": "Muitas tentativas seguidas"},
    },
)
@limiter.limit(LOGIN_LIMIT)
def delete_my_account(
    request: Request,  # noqa: ARG001 - exigido pelo limitador
    data: AccountDeletion,
    user: CurrentUserDep,
    service: AccountServiceDep,
) -> None:
    service.delete(user, data.senha)
