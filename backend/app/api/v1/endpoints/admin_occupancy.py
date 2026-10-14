from typing import Annotated

from fastapi import APIRouter, Depends, Query, Response

from app.api.dependencies import OccupancyServiceDep, release_no_shows, require_admin
from app.schemas.errors import ADMIN_ONLY, ErrorResponse, ResponsesDoc
from app.schemas.occupancy import OccupancyParams, OccupancyRead

router = APIRouter(
    prefix="/admin",
    tags=["Administração"],
    dependencies=[Depends(require_admin), Depends(release_no_shows)],
    responses=ADMIN_ONLY,
)

INVALID_PERIOD: ResponsesDoc = {
    422: {
        "model": ErrorResponse,
        "description": (
            "Período inválido (`PERIODO_INVALIDO`): data final antes da inicial ou mais de 92 "
            "dias. Data fora do formato AAAA-MM-DD volta no formato de validação do FastAPI"
        ),
    }
}
PERIOD_RULES = (
    "Período em dias do fuso do campus, `inicio` e `fim` inclusivos (AAAA-MM-DD). Sem datas, "
    "os últimos 30 dias até hoje; só com `fim`, os 30 dias que terminam nele; só com `inicio`, "
    "até hoje. No máximo 92 dias. `bloco_id` restringe aos recursos do bloco. Considera os "
    "recursos ativos em blocos ativos. Antes de calcular, libera as reservas vencidas sem "
    "check-in."
)


@router.get(
    "/ocupacao",
    summary="Painel de ocupação: uso dos espaços, cancelamentos e não comparecimentos",
    description=(
        f"{PERIOD_RULES}\n\n"
        "- `horas_disponiveis`: horas de funcionamento de cada dia do período, somadas por "
        "recurso.\n"
        "- `horas_reservadas` e `taxa_ocupacao`: só reservas `CONFIRMADA`, recortadas ao "
        "período e ao funcionamento. Canceladas e não comparecimentos não ocupam.\n"
        "- `reservas` (`CONFIRMADA` e `NAO_COMPARECEU`) e `cancelamentos` contam as que começam "
        "no período; `checkins`, só as que já começaram.\n"
        "- `taxa_comparecimento` é nula quando não há check-in nem não comparecimento.\n"
        "- `horas_devolvidas`: da liberação ao fim de cada `NAO_COMPARECEU`, horas que voltaram "
        "a ficar livres.\n"
        "- `mapa_calor`: ocupação por dia da semana (1 = segunda) e hora local, só nas horas em "
        "que o campus abre.\n"
        "- `recursos`: da maior para a menor ocupação, depois por nome."
    ),
    response_model=OccupancyRead,
    responses=INVALID_PERIOD,
)
def get_occupancy(
    service: OccupancyServiceDep, params: Annotated[OccupancyParams, Query()]
) -> OccupancyRead:
    return service.report(params)


@router.get(
    "/ocupacao.csv",
    summary="Planilha do painel de ocupação, uma linha por recurso",
    description=(
        f"{PERIOD_RULES}\n\n"
        "CSV para o Excel em pt-BR: UTF-8 com BOM, colunas separadas por `;` e vírgula decimal. "
        "Colunas: Recurso, Bloco, Tipo, Horas disponíveis, Horas reservadas, Ocupação (%), "
        "Reservas, Cancelamentos, Não comparecimentos e Horas devolvidas, na ordem do painel. "
        "Sem dados pessoais. Vem como anexo `ocupacao-AAAA-MM-DD-a-AAAA-MM-DD.csv`."
    ),
    response_class=Response,
    responses={
        200: {
            "description": "Planilha CSV (anexo)",
            "content": {"text/csv": {"schema": {"type": "string"}}},
        },
        **INVALID_PERIOD,
    },
)
def export_occupancy_csv(
    service: OccupancyServiceDep, params: Annotated[OccupancyParams, Query()]
) -> Response:
    file = service.export_csv(params)
    return Response(
        content=file.content,
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{file.filename}"'},
    )
