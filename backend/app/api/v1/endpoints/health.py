from fastapi import APIRouter

from app.api.dependencies import HealthServiceDep
from app.schemas.errors import ErrorResponse
from app.schemas.health import HealthRead

router = APIRouter(prefix="/health", tags=["Saúde"])


@router.get(
    "",
    summary="Verifica se a API e o banco estão respondendo",
    description=(
        "Público, para o monitoramento e o health check do deploy. Faz uma consulta mínima ao "
        "banco."
    ),
    response_model=HealthRead,
    responses={
        503: {
            "model": ErrorResponse,
            "description": "Banco de dados indisponível (`BANCO_INDISPONIVEL`)",
        }
    },
)
def health(service: HealthServiceDep) -> HealthRead:
    return service.check()
