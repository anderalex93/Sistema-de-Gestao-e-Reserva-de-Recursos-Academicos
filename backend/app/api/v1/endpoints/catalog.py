from collections.abc import Sequence
from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.api.dependencies import (
    AvailabilityServiceDep,
    CatalogServiceDep,
    CurrentUserDep,
    get_current_user,
)
from app.models.building import Building
from app.models.feature import Feature
from app.models.resource import Resource
from app.schemas.availability import AvailabilityRead
from app.schemas.catalog import BuildingRead, FeatureRead, ResourceRead, ResourceSearchParams
from app.schemas.errors import UNAUTHORIZED, ErrorResponse, ResponsesDoc
from app.schemas.pagination import Page

router = APIRouter(
    tags=["Catálogo"],
    dependencies=[Depends(get_current_user)],
    responses=UNAUTHORIZED,
)

RESOURCE_NOT_FOUND: ResponsesDoc = {
    404: {"model": ErrorResponse, "description": "Recurso inexistente ou inativo"}
}


@router.get(
    "/blocos",
    summary="Lista os blocos do campus",
    description="Só os blocos ativos, em ordem de nome, para o filtro da busca.",
    response_model=list[BuildingRead],
)
def list_buildings(service: CatalogServiceDep) -> Sequence[Building]:
    return service.list_buildings()


@router.get(
    "/caracteristicas",
    summary="Lista as características usadas nos filtros",
    description="Todas as características cadastradas, em ordem de nome.",
    response_model=list[FeatureRead],
)
def list_features(service: CatalogServiceDep) -> Sequence[Feature]:
    return service.list_features()


@router.get(
    "/recursos",
    summary="Busca recursos para reservar, com filtros e horário livre",
    description=(
        "Só recursos ativos de blocos ativos, paginados. Os filtros se combinam com E e "
        "`caracteristicas` exige todas as informadas. Com `inicio` e `fim` (sempre juntos, com "
        "fuso), traz só recursos sem reserva confirmada que se sobreponha ao intervalo; o "
        "intervalo não pode ter começado."
    ),
    response_model=Page[ResourceRead],
    responses={
        422: {
            "model": ErrorResponse,
            "description": (
                "Intervalo no passado (`INTERVALO_NO_PASSADO`), incompleto ou com o fim antes "
                "do início"
            ),
        }
    },
)
def search_resources(
    service: CatalogServiceDep, params: Annotated[ResourceSearchParams, Query()]
) -> Page[ResourceRead]:
    return Page[ResourceRead].model_validate(service.search_resources(params))


@router.get(
    "/recursos/{resource_id}",
    summary="Detalhe de um recurso",
    description="Recurso desativado, ou de bloco desativado, responde 404 como se não existisse.",
    response_model=ResourceRead,
    responses=RESOURCE_NOT_FOUND,
)
def get_resource(resource_id: int, service: CatalogServiceDep) -> Resource:
    return service.get_resource(resource_id)


@router.get(
    "/recursos/{resource_id}/disponibilidade",
    summary="Grade de horários de 30 minutos de um recurso num dia",
    description=(
        "Dia no fuso do campus (America/Maceio). Cada horário vem `LIVRE`, `OCUPADO` ou "
        "`PASSADO`. Dia em que o campus não abre volta sem horários. Quem reservou só é "
        "identificado para administradores."
    ),
    response_model=AvailabilityRead,
    responses=RESOURCE_NOT_FOUND,
)
def get_availability(
    resource_id: int,
    data: Annotated[date, Query(description="Dia, AAAA-MM-DD")],
    user: CurrentUserDep,
    service: AvailabilityServiceDep,
) -> AvailabilityRead:
    return service.for_day(resource_id, data, user)
