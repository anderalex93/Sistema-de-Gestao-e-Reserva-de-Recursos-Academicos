from fastapi import APIRouter

from app.api.dependencies import RulesServiceDep
from app.schemas.rules import RulesRead

router = APIRouter(prefix="/config", tags=["Configuração"])


@router.get(
    "/regras",
    summary="Horário de funcionamento e regras de reserva (público)",
    description=(
        "Sem login. Fuso, tamanho do intervalo da grade, horário de cada dia da semana, duração "
        "máxima, antecedência máxima e limite de reservas ativas por perfil, como estão "
        "configurados no servidor. O front usa estes valores para montar a grade e validar o "
        "formulário antes de chamar `POST /api/v1/reservas`."
    ),
    response_model=RulesRead,
)
def get_rules(service: RulesServiceDep) -> RulesRead:
    return service.rules()
