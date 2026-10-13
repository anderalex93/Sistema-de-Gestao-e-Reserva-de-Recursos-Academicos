"""Autoatendimento do titular dos dados (LGPD, Art. 18): exportar e excluir a própria conta."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.core.enums import ReservationStatus
from app.schemas.user import UserRead


class AccountDeletion(BaseModel):
    model_config = ConfigDict(extra="forbid")

    senha: str = Field(min_length=1, max_length=128, description="Senha atual, para confirmar")


class ReservationExportRead(BaseModel):
    codigo: str
    status: ReservationStatus
    recurso: str
    bloco: str
    inicio: datetime
    fim: datetime
    finalidade: str | None
    qtd_participantes: int | None
    criado_em: datetime
    cancelada_em: datetime | None
    motivo_cancelamento: str | None


class MyDataExport(BaseModel):
    """Tudo o que o EduSpace guarda sobre a pessoa, num arquivo só (Art. 18, II e V)."""

    gerado_em: datetime
    conta: UserRead
    reservas: list[ReservationExportRead]
