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
    # Sem check-in até o fim da tolerância: o horário volta a ficar livre (#43).
    NAO_COMPARECEU = "NAO_COMPARECEU"


class CheckinSituation(StrEnum):
    """O que a leitura do QR Code de um espaço encontra para quem leu (#43)."""

    DISPONIVEL = "DISPONIVEL"
    FEITO = "FEITO"
    CEDO = "CEDO"
    LIBERADA = "LIBERADA"
    SEM_RESERVA = "SEM_RESERVA"


class SlotStatus(StrEnum):
    """Situação de um intervalo de 30 minutos na grade de disponibilidade."""

    LIVRE = "LIVRE"
    OCUPADO = "OCUPADO"
    PASSADO = "PASSADO"


class ReservationScope(StrEnum):
    """Abas de Minhas Reservas."""

    PROXIMAS = "proximas"
    HISTORICO = "historico"


class RemovalOutcome(StrEnum):
    """O que aconteceu ao excluir um bloco ou recurso pela administração."""

    EXCLUIDO = "EXCLUIDO"
    DESATIVADO = "DESATIVADO"
