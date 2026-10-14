from fastapi import APIRouter, Depends

from app.api.dependencies import AdminDep, CampusSettingsServiceDep, require_admin
from app.schemas.campus_settings import CampusSettingsRead, CampusSettingsUpdate
from app.schemas.errors import ADMIN_ONLY

router = APIRouter(
    prefix="/admin/configuracoes",
    tags=["Administração"],
    dependencies=[Depends(require_admin)],
    responses=ADMIN_ONLY,
)


@router.get(
    "",
    summary="Horário de funcionamento e regras de uso em vigor",
    description=(
        "Enquanto a administração não salvar, mostra os valores do ambiente (`origem = AMBIENTE`)."
    ),
    response_model=CampusSettingsRead,
)
def get_settings(service: CampusSettingsServiceDep) -> CampusSettingsRead:
    return service.read()


@router.put(
    "",
    summary="Altera o horário de funcionamento e as regras de uso",
    description=(
        "Vale na próxima requisição, sem reiniciar a API. Reservas já feitas não mudam: as "
        "regras novas valem para as próximas reservas. Horários em blocos de 30 minutos."
    ),
    response_model=CampusSettingsRead,
)
def update_settings(
    data: CampusSettingsUpdate, admin: AdminDep, service: CampusSettingsServiceDep
) -> CampusSettingsRead:
    return service.update(data, admin)
