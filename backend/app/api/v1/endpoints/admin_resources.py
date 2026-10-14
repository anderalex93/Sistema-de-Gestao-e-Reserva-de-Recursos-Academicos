from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.api.dependencies import AdminDep, ResourceAdminServiceDep, require_admin
from app.models.resource import Resource
from app.schemas.catalog_admin import (
    RemovalRead,
    ResourceAdminRead,
    ResourceAdminSearchParams,
    ResourceCreate,
    ResourceUpdate,
)
from app.schemas.errors import ADMIN_ONLY, ErrorResponse, ResponsesDoc
from app.schemas.pagination import Page

router = APIRouter(
    prefix="/admin/recursos",
    tags=["Administração"],
    dependencies=[Depends(require_admin)],
    responses=ADMIN_ONLY,
)

NOT_FOUND: ResponsesDoc = {404: {"model": ErrorResponse, "description": "Recurso inexistente"}}
WRITE_ERRORS: ResponsesDoc = {
    409: {
        "model": ErrorResponse,
        "description": "Já existe um recurso com este nome no bloco (`RECURSO_JA_EXISTE`)",
    },
    422: {
        "model": ErrorResponse,
        "description": (
            "Bloco inexistente ou desativado (`BLOCO_INVALIDO`), característica inexistente "
            "(`CARACTERISTICA_INVALIDA`) ou campos inválidos, como capacidade ausente"
        ),
    },
}


@router.get(
    "",
    summary="Lista recursos ativos e desativados, com busca e filtros",
    description=(
        "Paginada. `busca` procura no nome; sem o filtro `ativo`, traz ativos e desativados, "
        "inclusive os de blocos desativados."
    ),
    response_model=Page[ResourceAdminRead],
)
def list_resources(
    service: ResourceAdminServiceDep, params: Annotated[ResourceAdminSearchParams, Query()]
) -> Page[ResourceAdminRead]:
    return Page[ResourceAdminRead].model_validate(service.search(params))


@router.get(
    "/{resource_id}",
    summary="Detalhe de um recurso, mesmo desativado",
    description="Traz a situação do recurso e a do bloco, para a tela de edição.",
    response_model=ResourceAdminRead,
    responses=NOT_FOUND,
)
def get_resource(resource_id: int, service: ResourceAdminServiceDep) -> Resource:
    return service.get(resource_id)


@router.post(
    "",
    status_code=201,
    summary="Cria um recurso, que aparece na busca na hora",
    description=(
        "Só em bloco ativo. Sala, laboratório e auditório exigem `capacidade`; só equipamento "
        "pode ficar sem. O nome é único dentro do bloco e as características precisam existir."
    ),
    response_model=ResourceAdminRead,
    responses=WRITE_ERRORS,
)
def create_resource(data: ResourceCreate, service: ResourceAdminServiceDep) -> Resource:
    return service.create(data)


@router.put(
    "/{resource_id}",
    summary="Altera todos os dados de um recurso",
    description=(
        "Substitui todos os campos, inclusive a lista de características. Mudar de bloco só "
        "para um bloco ativo; recurso que já está num bloco desativado pode ser editado sem "
        "sair dele. As reservas existentes não mudam."
    ),
    response_model=ResourceAdminRead,
    responses={**NOT_FOUND, **WRITE_ERRORS},
)
def update_resource(
    resource_id: int, data: ResourceUpdate, service: ResourceAdminServiceDep
) -> Resource:
    return service.update(resource_id, data)


@router.delete(
    "/{resource_id}",
    summary="Exclui um recurso sem histórico ou desativa um recurso já reservado",
    description=(
        "Sem nenhuma reserva, o recurso é apagado. Com reservas, é desativado: some da busca e "
        "o histórico continua. Se houver reservas que ainda não começaram, responde `409 "
        "RESERVAS_FUTURAS` com a quantidade; repita com `forcar=true` para cancelá-las."
    ),
    response_model=RemovalRead,
    responses={
        **NOT_FOUND,
        409: {
            "model": ErrorResponse,
            "description": "Há reservas futuras e `forcar` é falso (`RESERVAS_FUTURAS`)",
        },
    },
)
def remove_resource(
    resource_id: int,
    admin: AdminDep,
    service: ResourceAdminServiceDep,
    forcar: Annotated[bool, Query(description="Cancela as reservas futuras")] = False,
) -> RemovalRead:
    return service.remove(resource_id, admin, force=forcar)


@router.post(
    "/{resource_id}/reativar",
    summary="Reativa um recurso desativado",
    description=(
        "O recurso volta para a busca, desde que o bloco dele também esteja ativo. Reservas "
        "canceladas na desativação não voltam."
    ),
    response_model=ResourceAdminRead,
    responses=NOT_FOUND,
)
def reactivate_resource(resource_id: int, service: ResourceAdminServiceDep) -> Resource:
    return service.reactivate(resource_id)
