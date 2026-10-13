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
