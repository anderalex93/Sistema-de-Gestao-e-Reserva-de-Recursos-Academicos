from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.api.dependencies import AdminDep, BuildingAdminServiceDep, require_admin
from app.schemas.catalog_admin import (
    BuildingAdminRead,
    BuildingCreate,
    BuildingUpdate,
    RemovalRead,
)
from app.schemas.errors import ErrorResponse, ResponsesDoc

router = APIRouter(
    prefix="/admin/blocos",
    tags=["Administração"],
    dependencies=[Depends(require_admin)],
    responses={
        401: {"model": ErrorResponse, "description": "Sem sessão válida"},
        403: {"model": ErrorResponse, "description": "Apenas administradores"},
    },
)

NOT_FOUND: ResponsesDoc = {404: {"model": ErrorResponse, "description": "Bloco inexistente"}}
NAME_TAKEN: ResponsesDoc = {
    409: {"model": ErrorResponse, "description": "Já existe um bloco com este nome"}
}


@router.get(
    "",
    summary="Lista todos os blocos, ativos e desativados",
    response_model=list[BuildingAdminRead],
)
def list_buildings(service: BuildingAdminServiceDep) -> list[BuildingAdminRead]:
    return service.list_all()


@router.post(
    "",
    status_code=201,
    summary="Cria um bloco",
    response_model=BuildingAdminRead,
    responses=NAME_TAKEN,
)
def create_building(data: BuildingCreate, service: BuildingAdminServiceDep) -> BuildingAdminRead:
    return service.create(data)


@router.put(
    "/{building_id}",
    summary="Altera nome e descrição de um bloco",
    response_model=BuildingAdminRead,
    responses={**NOT_FOUND, **NAME_TAKEN},
)
def update_building(
    building_id: int, data: BuildingUpdate, service: BuildingAdminServiceDep
) -> BuildingAdminRead:
    return service.update(building_id, data)


@router.delete(
    "/{building_id}",
    summary="Exclui um bloco vazio ou desativa um bloco com recursos",
    description=(
        "Bloco sem recursos é apagado. Com recursos, é desativado: todos somem da busca e o "
        "histórico continua. Se houver reservas que ainda não começaram, responde `409 "
        "RESERVAS_FUTURAS` com a quantidade; repita com `forcar=true` para cancelá-las."
    ),
    response_model=RemovalRead,
    responses={
        **NOT_FOUND,
        409: {"model": ErrorResponse, "description": "Há reservas futuras e `forcar` é falso"},
    },
)
def remove_building(
    building_id: int,
    admin: AdminDep,
    service: BuildingAdminServiceDep,
    forcar: Annotated[bool, Query(description="Cancela as reservas futuras")] = False,
) -> RemovalRead:
    return service.remove(building_id, admin, force=forcar)


@router.post(
    "/{building_id}/reativar",
    summary="Reativa um bloco desativado",
    response_model=BuildingAdminRead,
    responses=NOT_FOUND,
)
def reactivate_building(building_id: int, service: BuildingAdminServiceDep) -> BuildingAdminRead:
    return service.reactivate(building_id)
