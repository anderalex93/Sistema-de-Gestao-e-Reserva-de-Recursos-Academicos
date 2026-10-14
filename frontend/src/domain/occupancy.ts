/** Painel de ocupação (#44): faixas do mapa de calor, rótulos e períodos. */
import { addDays, campusToday } from '@/domain/schedule';
import { colors } from '@/theme/tokens';

/**
 * Rampa sequencial de um só tom (azul UMJ, claro → marinho), validada com o script da skill de
 * visualização: luminosidade monotônica e o passo mais claro com 2,14:1 sobre a superfície.
 * Zero não entra na rampa: fica neutro (superfície e borda), para "nada" não parecer "pouco".
 */
const RAMP = [
  { upTo: 0.2, background: '#9DB0DA', text: colors.ink },
  { upTo: 0.4, background: '#7189C3', text: colors.ink },
  { upTo: 0.6, background: '#4C69AF', text: colors.paper },
  { upTo: 0.8, background: colors.primary, text: colors.paper },
  { upTo: 1, background: colors.ink, text: colors.paper },
] as const;

export interface HeatStep {
  background: string;
  text: string;
}

export const EMPTY_STEP: HeatStep = { background: colors.surface, text: colors.inkMuted };

export function heatStep(rate: number): HeatStep {
  if (rate <= 0) return EMPTY_STEP;
  return RAMP.find((step) => rate <= step.upTo) ?? RAMP[RAMP.length - 1] ?? EMPTY_STEP;
}

/** Legenda: zero e as cinco faixas, com o intervalo de cada uma. */
export const HEAT_LEGEND: readonly (HeatStep & { label: string })[] = [
  { ...EMPTY_STEP, label: '0%' },
  ...RAMP.map((step) => ({
    background: step.background,
    text: step.text,
    label: `até ${Math.round(step.upTo * 100)}%`,
  })),
];

const PERCENT = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 0 });
const HOURS = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

export function percent(rate: number): string {
  return PERCENT.format(rate);
}

export function hours(value: number): string {
  return `${HOURS.format(value)} h`;
}

export const WEEKDAY_LABELS: Record<number, string> = {
  1: 'Seg',
  2: 'Ter',
  3: 'Qua',
  4: 'Qui',
  5: 'Sex',
  6: 'Sáb',
  7: 'Dom',
};

export const WEEKDAY_NAMES: Record<number, string> = {
  1: 'segunda',
  2: 'terça',
  3: 'quarta',
  4: 'quinta',
  5: 'sexta',
  6: 'sábado',
  7: 'domingo',
};

export function hourLabel(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`;
}

export const PERIOD_PRESETS = [7, 30, 90] as const;
export type PeriodPreset = (typeof PERIOD_PRESETS)[number];

/** Período que termina hoje com `days` dias, contando hoje (o mesmo padrão da API). */
export function presetPeriod(days: PeriodPreset, today: string = campusToday()) {
  return { inicio: addDays(today, -(days - 1)), fim: today };
}
