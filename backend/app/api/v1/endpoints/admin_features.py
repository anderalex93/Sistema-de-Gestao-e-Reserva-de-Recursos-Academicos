from fastapi import APIRouter, Depends

from app.api.dependencies import FeatureAdminServiceDep, require_admin
from app.schemas.catalog_admin import FeatureAdminRead, FeatureCreate, FeatureUpdate
from app.schemas.errors import ADMIN_ONLY, ErrorResponse, ResponsesDoc

router = APIRouter(
    prefix="/admin/caracteristicas",
    tags=["Administração"],
    dependencies=[Depends(require_admin)],
    responses=ADMIN_ONLY,
)

NOT_FOUND: ResponsesDoc = {
    404: {"model": ErrorResponse, "description": "Característica inexistente"}
}
NAME_TAKEN: ResponsesDoc = {
    409: {
        "model": ErrorResponse,
        "description": "Já existe uma característica com este nome (`CARACTERISTICA_JA_EXISTE`)",
    }
}


@router.get(
    "",
    summary="Lista as características com quantos recursos usam cada uma",
    description="Ordem alfabética. O total ajuda a decidir se vale renomear ou excluir.",
    response_model=list[FeatureAdminRead],
)
def list_features(service: FeatureAdminServiceDep) -> list[FeatureAdminRead]:
    return service.list_all()


@router.post(
    "",
    status_code=201,
    summary="Cria uma característica",
    description=(
        "Atributo usado no filtro da busca (projetor, ar-condicionado...). O nome é único e tem "
        "de 2 a 60 caracteres."
    ),
    response_model=FeatureAdminRead,
    responses=NAME_TAKEN,
)
def create_feature(data: FeatureCreate, service: FeatureAdminServiceDep) -> FeatureAdminRead:
    return service.create(data)


@router.put(
    "/{feature_id}",
    summary="Renomeia uma característica",
    description="O novo nome passa a valer em todos os recursos que já a usam.",
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
    description=(
        "É só um atributo de busca: os recursos continuam cadastrados, apenas sem ela. Não há "
        "como desfazer."
    ),
    responses=NOT_FOUND,
)
def remove_feature(feature_id: int, service: FeatureAdminServiceDep) -> None:
    service.remove(feature_id)
