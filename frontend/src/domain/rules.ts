/** Regras de uso do campus (issue #28), vindas de `GET /config/regras`. */
import {
  addDays,
  campusToday,
  DEFAULT_WEEKLY_HOURS,
  SLOT_MINUTES,
  weeklyHoursFrom,
  type WeeklyHours,
} from '@/domain/schedule';
import type { RulesRead, UserRole } from '@/lib/api/types';

export interface CampusRules {
  weeklyHours: WeeklyHours;
  maxMinutes: number;
  maxDaysAhead: number;
  /** `null` = sem limite. */
  activeLimits: Partial<Record<UserRole, number | null>>;
}

/** Igual ao padrão do back; vale só até a API responder. */
export const DEFAULT_RULES: CampusRules = {
  weeklyHours: DEFAULT_WEEKLY_HOURS,
  maxMinutes: 240,
  maxDaysAhead: 14,
  activeLimits: { ALUNO: 3, PROFESSOR: 10, ADMIN: null },
};

export function rulesFrom(rules: RulesRead): CampusRules {
  return {
    weeklyHours: weeklyHoursFrom(rules),
    maxMinutes: rules.duracao_max_minutos,
    maxDaysAhead: rules.antecedencia_max_dias,
    activeLimits: rules.limite_reservas_ativas,
  };
}

/** Última data em que dá para reservar. */
export function lastBookableDate(rules: CampusRules, today: string = campusToday()): string {
  return addDays(today, rules.maxDaysAhead);
}

export function maxSlots(rules: CampusRules): number {
  return Math.floor(rules.maxMinutes / SLOT_MINUTES);
}

export function activeLimitFor(rules: CampusRules, role: UserRole): number | null {
  return rules.activeLimits[role] ?? null;
}
