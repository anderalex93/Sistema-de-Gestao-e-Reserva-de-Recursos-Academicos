from fastapi import APIRouter, Depends

from app.api.dependencies import FeatureAdminServiceDep, require_admin
from app.schemas.catalog_admin import FeatureAdminRead, FeatureCreate, FeatureUpdate
from app.schemas.errors import ErrorResponse, ResponsesDoc

router = APIRouter(
    prefix="/admin/caracteristicas",
    tags=["Administração"],
    dependencies=[Depends(require_admin)],
    responses={
        401: {"model": ErrorResponse, "description": "Sem sessão válida"},
        403: {"model": ErrorResponse, "description": "Apenas administradores"},
    },
)

NOT_FOUND: ResponsesDoc = {
    404: {"model": ErrorResponse, "description": "Característica inexistente"}
}
NAME_TAKEN: ResponsesDoc = {
    409: {"model": ErrorResponse, "description": "Já existe uma característica com este nome"}
}


@router.get(
    "",
    summary="Lista as características com quantos recursos usam cada uma",
    response_model=list[FeatureAdminRead],
)
def list_features(service: FeatureAdminServiceDep) -> list[FeatureAdminRead]:
    return service.list_all()


@router.post(
    "",
    status_code=201,
    summary="Cria uma característica",
    response_model=FeatureAdminRead,
    responses=NAME_TAKEN,
)
def create_feature(data: FeatureCreate, service: FeatureAdminServiceDep) -> FeatureAdminRead:
    return service.create(data)


@router.put(
    "/{feature_id}",
    summary="Renomeia uma característica",
    response_model=FeatureAdminRead,
    responses={**NOT_FOUND, **NAME_TAKEN},
)
def update_feature(
    feature_id: int, data: FeatureUpdate, service: FeatureAdminServiceDep
) -> FeatureAdminRead:
    return service.update(feature_id, data)


@router.delete(
    "/{feature_id}",
    status_code=204,
    summary="Exclui uma característica e a retira dos recursos que a usam",
    responses=NOT_FOUND,
)
def remove_feature(feature_id: int, service: FeatureAdminServiceDep) -> None:
    service.remove(feature_id)
