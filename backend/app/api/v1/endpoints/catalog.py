from collections.abc import Sequence
from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.api.dependencies import CatalogServiceDep, get_current_user
from app.models.building import Building
from app.models.feature import Feature
from app.models.resource import Resource
from app.schemas.catalog import BuildingRead, FeatureRead, ResourceRead
from app.schemas.errors import ErrorResponse
from app.schemas.pagination import Page, PageParams

router = APIRouter(
    tags=["Catálogo"],
    dependencies=[Depends(get_current_user)],
    responses={401: {"model": ErrorResponse, "description": "Sem sessão válida"}},
)


@router.get("/blocos", summary="Lista os blocos do campus", response_model=list[BuildingRead])
def list_buildings(service: CatalogServiceDep) -> Sequence[Building]:
    return service.list_buildings()


@router.get(
    "/caracteristicas",
    summary="Lista as características usadas nos filtros",
    response_model=list[FeatureRead],
)
def list_features(service: CatalogServiceDep) -> Sequence[Feature]:
    return service.list_features()


@router.get(
    "/recursos",
    summary="Lista os recursos disponíveis para reserva",
    response_model=Page[ResourceRead],
)
def list_resources(
    service: CatalogServiceDep, params: Annotated[PageParams, Query()]
) -> Page[ResourceRead]:
    return Page[ResourceRead].model_validate(service.list_resources(params.page, params.per_page))


@router.get(
    "/recursos/{resource_id}",
    summary="Detalhe de um recurso",
    response_model=ResourceRead,
    responses={404: {"model": ErrorResponse, "description": "Recurso inexistente ou inativo"}},
)
def get_resource(resource_id: int, service: CatalogServiceDep) -> Resource:
    return service.get_resource(resource_id)
