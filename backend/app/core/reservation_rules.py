"""Regras de uso que mantêm o sistema justo (issue #28). Valores vêm do ambiente."""

from collections.abc import Mapping
from dataclasses import dataclass
from datetime import timedelta
from types import MappingProxyType
from typing import Self

from app.core.config import Settings
from app.core.enums import UserRole


@dataclass(frozen=True, slots=True)
class ReservationRules:
    max_duration: timedelta
    max_days_ahead: int
    # `None` = sem limite (administrador).
    active_limits: Mapping[UserRole, int | None]
    # Check-in (#43): prazo depois do início (zero = opcional) e abertura antes dele.
    checkin_tolerance: timedelta = timedelta(minutes=15)
    checkin_lead: timedelta = timedelta(minutes=15)

    @classmethod
    def from_settings(cls, settings: Settings) -> Self:
        return cls(
            max_duration=timedelta(minutes=settings.reservation_max_minutes),
            max_days_ahead=settings.reservation_max_days_ahead,
            active_limits=MappingProxyType(
                {
                    UserRole.ALUNO: settings.active_limit_student,
                    UserRole.PROFESSOR: settings.active_limit_teacher,
                    UserRole.ADMIN: None,
                }
            ),
            checkin_tolerance=timedelta(minutes=settings.checkin_tolerance_minutes),
            checkin_lead=timedelta(minutes=settings.checkin_lead_minutes),
        )

    def active_limit_for(self, role: UserRole) -> int | None:
        return self.active_limits.get(role)

    @property
    def checkin_required(self) -> bool:
        """Com tolerância zero o check-in é opcional e nenhuma reserva é liberada sozinha."""
        return self.checkin_tolerance > timedelta(0)


def duration_label(duration: timedelta) -> str:
    """Rótulo curto da duração: 4h, 1h30 ou 30 min."""
    minutes = int(duration.total_seconds() // 60)
    hours, rest = divmod(minutes, 60)
    if not hours:
        return f"{rest} min"
    return f"{hours}h{rest:02d}" if rest else f"{hours}h"
