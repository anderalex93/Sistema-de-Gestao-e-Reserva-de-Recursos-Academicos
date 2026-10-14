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
  /** #43: minutos depois do início para fazer check-in; 0 = check-in opcional. */
  checkinToleranceMin: number;
  /** #43: o check-in abre este tanto antes do início. */
  checkinLeadMin: number;
}

/** Igual ao padrão do back; vale só até a API responder. */
export const DEFAULT_RULES: CampusRules = {
  weeklyHours: DEFAULT_WEEKLY_HOURS,
  maxMinutes: 240,
  maxDaysAhead: 14,
  activeLimits: { ALUNO: 3, PROFESSOR: 10, ADMIN: null },
  checkinToleranceMin: 15,
  checkinLeadMin: 15,
};

/**
 * Campo ausente cai no padrão: durante um deploy o front novo pode falar com uma API anterior
 * à #28, e isso não deve derrubar a tela.
 */
export function rulesFrom(rules: Partial<RulesRead> & Pick<RulesRead, 'horarios'>): CampusRules {
  return {
    weeklyHours: weeklyHoursFrom(rules),
    maxMinutes: rules.duracao_max_minutos ?? DEFAULT_RULES.maxMinutes,
    maxDaysAhead: rules.antecedencia_max_dias ?? DEFAULT_RULES.maxDaysAhead,
    activeLimits: rules.limite_reservas_ativas ?? DEFAULT_RULES.activeLimits,
    checkinToleranceMin: rules.checkin_tolerancia_min ?? DEFAULT_RULES.checkinToleranceMin,
    checkinLeadMin: rules.checkin_antecedencia_min ?? DEFAULT_RULES.checkinLeadMin,
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

export interface CheckinWindow {
  opensAt: Date;
  /** Prazo para o check-in; depois dele a reserva é liberada (`null` se o check-in é opcional). */
  deadline: Date | null;
}

/** Janela de check-in de uma reserva (#43), com as regras vindas da API. */
export function checkinWindow(rules: CampusRules, inicio: string): CheckinWindow {
  const start = Date.parse(inicio);
  return {
    opensAt: new Date(start - rules.checkinLeadMin * 60_000),
    deadline:
      rules.checkinToleranceMin > 0 ? new Date(start + rules.checkinToleranceMin * 60_000) : null,
  };
}
