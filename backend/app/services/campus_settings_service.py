from datetime import datetime, time, timedelta
from types import MappingProxyType
from typing import Any

from app.core.campus_schedule import CampusSchedule
from app.core.config import Settings
from app.core.enums import SettingsSource, UserRole
from app.core.opening_hours import DayHours, WeeklyHours
from app.core.reservation_rules import ReservationRules
from app.db.unit_of_work import UnitOfWork
from app.models.campus_settings import CampusSettings
from app.models.user import User
from app.repositories.campus_settings_repository import CampusSettingsRepository
from app.schemas.campus_settings import CampusSettingsRead, CampusSettingsUpdate
from app.schemas.rules import DayHoursRead

# Sem a linha da administração, a resposta é montada com os valores do ambiente.
_NOT_SAVED: tuple[datetime | None, str | None] = (None, None)


class CampusSettingsService:
    """Horário de funcionamento e regras de uso em vigor.

    A administração ajusta pela tela de Configurações e vale na próxima requisição, sem
    reiniciar a API. Até o primeiro ajuste valem os valores do ambiente. Reservas já feitas não
    mudam: as regras novas valem para as próximas.
    """

    def __init__(
        self, settings: CampusSettingsRepository, uow: UnitOfWork, defaults: Settings
    ) -> None:
        self._settings = settings
        self._uow = uow
        self._defaults = defaults
        self._loaded = False
        self._row: CampusSettings | None = None

    def schedule(self) -> CampusSchedule:
        row = self._current()
        if row is None:
            return CampusSchedule.from_settings(self._defaults)
        return CampusSchedule(self._defaults.timezone, _weekly_hours(row.horario_funcionamento))

    def rules(self) -> ReservationRules:
        row = self._current()
        if row is None:
            return ReservationRules.from_settings(self._defaults)
        return ReservationRules(
            max_duration=timedelta(minutes=row.duracao_max_minutos),
            max_days_ahead=row.antecedencia_max_dias,
            active_limits=MappingProxyType(
                {
                    UserRole.ALUNO: row.limite_ativas_aluno,
                    UserRole.PROFESSOR: row.limite_ativas_professor,
                    UserRole.ADMIN: None,
                }
            ),
            checkin_tolerance=timedelta(minutes=row.checkin_tolerancia_min),
            checkin_lead=timedelta(minutes=row.checkin_antecedencia_min),
        )

    def read(self) -> CampusSettingsRead:
        schedule, rules, row = self.schedule(), self.rules(), self._current()
        updated_at, updated_by = (
            _NOT_SAVED
            if row is None
            else (row.atualizado_em, row.atualizado_por.nome if row.atualizado_por else None)
        )
        return CampusSettingsRead(
            horarios=[
                DayHoursRead(dia_semana=weekday + 1, abertura=day.opening, fechamento=day.closing)
                for weekday, day in schedule.weekly_hours.items()
            ],
            duracao_max_minutos=_minutes(rules.max_duration),
            antecedencia_max_dias=rules.max_days_ahead,
            limite_ativas_aluno=rules.active_limit_for(UserRole.ALUNO) or 0,
            limite_ativas_professor=rules.active_limit_for(UserRole.PROFESSOR) or 0,
            checkin_tolerancia_min=_minutes(rules.checkin_tolerance),
            checkin_antecedencia_min=_minutes(rules.checkin_lead),
            origem=SettingsSource.AMBIENTE if row is None else SettingsSource.ADMINISTRACAO,
            atualizado_em=updated_at,
            atualizado_por=updated_by,
        )

    def update(self, data: CampusSettingsUpdate, admin: User) -> CampusSettingsRead:
        current = self._current()
        row = current or CampusSettings()
        row.horario_funcionamento = [
            {
                "dia_semana": day.dia_semana,
                "abertura": day.abertura.strftime("%H:%M"),
                "fechamento": day.fechamento.strftime("%H:%M"),
            }
            for day in data.horarios
        ]
        row.duracao_max_minutos = data.duracao_max_minutos
        row.antecedencia_max_dias = data.antecedencia_max_dias
        row.limite_ativas_aluno = data.limite_ativas_aluno
        row.limite_ativas_professor = data.limite_ativas_professor
        row.checkin_tolerancia_min = data.checkin_tolerancia_min
        row.checkin_antecedencia_min = data.checkin_antecedencia_min
        row.atualizado_por = admin
        if current is None:
            self._settings.add(row)
            self._row = row
        self._uow.commit()
        self._settings.refresh(row)
        return self.read()

    def _current(self) -> CampusSettings | None:
        # Horário e regras são pedidos várias vezes na mesma requisição: uma consulta basta.
        if not self._loaded:
            self._row = self._settings.current()
            self._loaded = True
        return self._row


def _weekly_hours(days: list[dict[str, Any]]) -> WeeklyHours:
    return MappingProxyType(
        {
            int(day["dia_semana"]) - 1: DayHours(
                time.fromisoformat(day["abertura"]), time.fromisoformat(day["fechamento"])
            )
            for day in sorted(days, key=lambda item: int(item["dia_semana"]))
        }
    )


def _minutes(duration: timedelta) -> int:
    return int(duration.total_seconds() // 60)
