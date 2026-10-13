from datetime import date, datetime

from pydantic import BaseModel, Field

from app.core.enums import SlotStatus


class SlotRead(BaseModel):
    inicio: datetime
    fim: datetime
    status: SlotStatus
    propria: bool = Field(description="O horário está reservado por quem consulta")
    reservado_por: str | None = Field(
        description="Nome de quem reservou. Só aparece para administradores (LGPD)"
    )


class AvailabilityRead(BaseModel):
    recurso_id: int
    data: date
    slots: list[SlotRead]
