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
from app.schemas.errors import ErrorResponse, ResponsesDoc
from app.schemas.pagination import Page

router = APIRouter(
    prefix="/admin/recursos",
    tags=["Administração"],
    dependencies=[Depends(require_admin)],
    responses={
        401: {"model": ErrorResponse, "description": "Sem sessão válida"},
        403: {"model": ErrorResponse, "description": "Apenas administradores"},
    },
)

NOT_FOUND: ResponsesDoc = {404: {"model": ErrorResponse, "description": "Recurso inexistente"}}
WRITE_ERRORS: ResponsesDoc = {
    409: {"model": ErrorResponse, "description": "Já existe um recurso com este nome no bloco"},
    422: {"model": ErrorResponse, "description": "Bloco desativado ou característica inexistente"},
}


@router.get(
    "",
    summary="Lista recursos ativos e desativados, com busca e filtros",
    response_model=Page[ResourceAdminRead],
)
def list_resources(
    service: ResourceAdminServiceDep, params: Annotated[ResourceAdminSearchParams, Query()]
) -> Page[ResourceAdminRead]:
    return Page[ResourceAdminRead].model_validate(service.search(params))


@router.get(
    "/{resource_id}",
    summary="Detalhe de um recurso, mesmo desativado",
    response_model=ResourceAdminRead,
    responses=NOT_FOUND,
)
def get_resource(resource_id: int, service: ResourceAdminServiceDep) -> Resource:
    return service.get(resource_id)


@router.post(
    "",
    status_code=201,
    summary="Cria um recurso, que aparece na busca na hora",
    response_model=ResourceAdminRead,
    responses=WRITE_ERRORS,
)
def create_resource(data: ResourceCreate, service: ResourceAdminServiceDep) -> Resource:
    return service.create(data)


@router.put(
    "/{resource_id}",
    summary="Altera todos os dados de um recurso",
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
        409: {"model": ErrorResponse, "description": "Há reservas futuras e `forcar` é falso"},
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
    response_model=ResourceAdminRead,
    responses=NOT_FOUND,
)
def reactivate_resource(resource_id: int, service: ResourceAdminServiceDep) -> Resource:
    return service.reactivate(resource_id)
