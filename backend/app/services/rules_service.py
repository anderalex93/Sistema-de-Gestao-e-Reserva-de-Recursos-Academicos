from app.core.campus_schedule import SLOT, CampusSchedule
from app.core.reservation_rules import ReservationRules
from app.schemas.rules import DayHoursRead, RulesRead


class RulesService:
    def __init__(self, schedule: CampusSchedule, rules: ReservationRules) -> None:
        self._schedule = schedule
        self._rules = rules

    def rules(self) -> RulesRead:
        return RulesRead(
            fuso=self._schedule.timezone.key,
            intervalo_minutos=int(SLOT.total_seconds() // 60),
            horarios=[
                DayHoursRead(
                    dia_semana=weekday + 1, abertura=hours.opening, fechamento=hours.closing
                )
                for weekday, hours in self._schedule.weekly_hours.items()
            ],
            duracao_max_minutos=int(self._rules.max_duration.total_seconds() // 60),
            antecedencia_max_dias=self._rules.max_days_ahead,
            limite_reservas_ativas=dict(self._rules.active_limits),
        )
