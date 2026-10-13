from fastapi import APIRouter

from app.api.dependencies import HealthServiceDep
from app.schemas.errors import ErrorResponse
from app.schemas.health import HealthRead

router = APIRouter(prefix="/health", tags=["Saúde"])


@router.get(
    "",
    summary="Verifica se a API e o banco estão respondendo",
    response_model=HealthRead,
    responses={503: {"model": ErrorResponse, "description": "Banco de dados indisponível"}},
)
def health(service: HealthServiceDep) -> HealthRead:
    return service.check()
