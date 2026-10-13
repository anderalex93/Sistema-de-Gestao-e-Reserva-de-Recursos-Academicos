from app.core.campus_schedule import SLOT, CampusSchedule
from app.schemas.rules import DayHoursRead, RulesRead


class RulesService:
    def __init__(self, schedule: CampusSchedule) -> None:
        self._schedule = schedule

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
        )
