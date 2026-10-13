"""Enums do domínio. Os valores são gravados no banco e trafegam na API como estão."""

from enum import StrEnum


class UserRole(StrEnum):
    ALUNO = "ALUNO"
    PROFESSOR = "PROFESSOR"
    ADMIN = "ADMIN"


class ResourceType(StrEnum):
    SALA_ESTUDO = "SALA_ESTUDO"
    LABORATORIO = "LABORATORIO"
    AUDITORIO = "AUDITORIO"
    EQUIPAMENTO = "EQUIPAMENTO"


class ReservationStatus(StrEnum):
    CONFIRMADA = "CONFIRMADA"
    CANCELADA = "CANCELADA"


class SlotStatus(StrEnum):
    """Situação de um intervalo de 30 minutos na grade de disponibilidade."""

    LIVRE = "LIVRE"
    OCUPADO = "OCUPADO"
    PASSADO = "PASSADO"


class ReservationScope(StrEnum):
    """Abas de Minhas Reservas."""

    PROXIMAS = "proximas"
    HISTORICO = "historico"
