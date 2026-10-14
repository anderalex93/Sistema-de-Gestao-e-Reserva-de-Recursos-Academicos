from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.api.dependencies import AdminDep, BuildingAdminServiceDep, require_admin
from app.schemas.catalog_admin import (
    BuildingAdminRead,
    BuildingCreate,
    BuildingUpdate,
    RemovalRead,
)
from app.schemas.errors import ADMIN_ONLY, ErrorResponse, ResponsesDoc

router = APIRouter(
    prefix="/admin/blocos",
    tags=["Administração"],
    dependencies=[Depends(require_admin)],
    responses=ADMIN_ONLY,
)

NOT_FOUND: ResponsesDoc = {404: {"model": ErrorResponse, "description": "Bloco inexistente"}}
NAME_TAKEN: ResponsesDoc = {
    409: {
        "model": ErrorResponse,
        "description": "Já existe um bloco com este nome (`BLOCO_JA_EXISTE`)",
    }
}


@router.get(
    "",
    summary="Lista todos os blocos, ativos e desativados",
    description=(
        "Ativos primeiro, cada um com o total de recursos cadastrados (ativos ou não). Quem "
        "reserva usa `GET /api/v1/blocos`, que traz só os ativos."
    ),
    response_model=list[BuildingAdminRead],
)
def list_buildings(service: BuildingAdminServiceDep) -> list[BuildingAdminRead]:
    return service.list_all()


@router.post(
    "",
    status_code=201,
    summary="Cria um bloco",
    description=(
        "O nome é único entre todos os blocos, inclusive os desativados. Descrição em branco "
        "é gravada como nula."
    ),
    response_model=BuildingAdminRead,
    responses=NAME_TAKEN,
)
def create_building(data: BuildingCreate, service: BuildingAdminServiceDep) -> BuildingAdminRead:
    return service.create(data)


@router.put(
    "/{building_id}",
    summary="Altera nome e descrição de um bloco",
    description=(
        "Substitui os dois campos. Desativar e reativar têm rotas próprias (`DELETE` e "
        "`/reativar`)."
    ),
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
        409: {
            "model": ErrorResponse,
            "description": "Há reservas futuras e `forcar` é falso (`RESERVAS_FUTURAS`)",
        },
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
    description=(
        "O bloco volta para a busca com os recursos que estavam ativos nele. Recursos "
        "desativados um a um continuam desativados."
    ),
    response_model=BuildingAdminRead,
    responses=NOT_FOUND,
)
def reactivate_building(building_id: int, service: BuildingAdminServiceDep) -> BuildingAdminRead:
    return service.reactivate(building_id)
