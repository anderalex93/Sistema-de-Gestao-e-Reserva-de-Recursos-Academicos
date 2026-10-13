from fastapi import APIRouter

from app.api.dependencies import RulesServiceDep
from app.schemas.rules import RulesRead

router = APIRouter(prefix="/config", tags=["Configuração"])


@router.get(
    "/regras",
    summary="Horário de funcionamento e regras de reserva (público)",
    response_model=RulesRead,
)
def get_rules(service: RulesServiceDep) -> RulesRead:
    return service.rules()
