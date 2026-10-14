from typing import Annotated

from fastapi import APIRouter, Query

from app.api.dependencies import BoardServiceDep, CurrentUserDep
from app.schemas.board import BoardParams, BoardRead
from app.schemas.errors import UNAUTHORIZED

router = APIRouter(prefix="/quadro", tags=["Quadro de horários"], responses=UNAUTHORIZED)


@router.get(
    "",
    summary="Ocupação de todos os recursos num dia",
    description=(
        "Para cada recurso ativo, os intervalos já reservados no dia (fuso do campus), com "
        "filtro opcional por bloco e tipo. Dia em que o campus não abre volta sem horário e sem "
        "linhas. Quem reservou só é identificado para administradores."
    ),
    response_model=BoardRead,
)
def get_board(
    params: Annotated[BoardParams, Query()], user: CurrentUserDep, service: BoardServiceDep
) -> BoardRead:
    return service.for_day(params, user)
