/**
 * Horários do campus. Tudo é exibido no fuso de Maceió e enviado à API em UTC.
 * O horário de funcionamento por dia vem de `GET /config/regras`.
 */
import dayjs from 'dayjs';

import type { RulesRead } from '@/lib/api/types';

export const CAMPUS_TIMEZONE = 'America/Maceio';
/** Maceió não tem horário de verão: UTC-3 o ano todo. */
const CAMPUS_UTC_OFFSET = '-03:00';
export const SLOT_MINUTES = 30;

export interface DayHours {
  /** `HH:mm` */
  opening: string;
  closing: string;
}

/** Horário por dia da semana ISO (1 = segunda, 7 = domingo). Dia ausente = fechado. */
export type WeeklyHours = ReadonlyMap<number, DayHours>;

/** Igual ao padrão do back; usado só até `/config/regras` responder. */
export const DEFAULT_WEEKLY_HOURS: WeeklyHours = new Map([
  ...[1, 2, 3, 4, 5].map((day): [number, DayHours] => [
    day,
    { opening: '08:00', closing: '21:00' },
  ]),
  [6, { opening: '08:00', closing: '12:00' }],
]);

export function weeklyHoursFrom(rules: Pick<RulesRead, 'horarios'>): WeeklyHours {
  return new Map(
    rules.horarios.map((day) => [
      day.dia_semana,
      { opening: day.abertura.slice(0, 5), closing: day.fechamento.slice(0, 5) },
    ]),
  );
}

function toMinutes(time: string): number {
  const [hours = 0, minutes = 0] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function fromMinutes(total: number): string {
  const hours = String(Math.floor(total / 60)).padStart(2, '0');
  const minutes = String(total % 60).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function marksBetween(opening: string, closing: string): string[] {
  const marks: string[] = [];
  for (let time = toMinutes(opening); time <= toMinutes(closing); time += SLOT_MINUTES) {
    marks.push(fromMinutes(time));
  }
  return marks;
}

/** Qualquer marca de 30 minutos do dia (`00:00` a `23:30`). */
export function isTimeMark(value: string): boolean {
  return /^([01]\d|2[0-3]):(00|30)$/.test(value);
}

export function isBefore(a: string, b: string): boolean {
  return toMinutes(a) < toMinutes(b);
}

/** Dia da semana ISO de uma data `AAAA-MM-DD` (calendário, sem fuso). */
export function isoWeekday(date: string): number {
  const day = new Date(`${date}T12:00:00Z`).getUTCDay();
  return day === 0 ? 7 : day;
}

export function hoursOn(date: string, weekly: WeeklyHours): DayHours | null {
  return weekly.get(isoWeekday(date)) ?? null;
}

/** Faixa que cobre todos os dias de funcionamento (para quando ainda não há data). */
function widestHours(weekly: WeeklyHours): DayHours | null {
  const days = [...weekly.values()];
  if (days.length === 0) return null;
  return days.reduce((wide, day) => ({
    opening: isBefore(day.opening, wide.opening) ? day.opening : wide.opening,
    closing: isBefore(wide.closing, day.closing) ? day.closing : wide.closing,
  }));
}

/** Data `AAAA-MM-DD` deslocada em dias. */
export function addDays(date: string, days: number): string {
  const [year = 0, month = 1, day = 1] = date.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

/** Data de hoje no campus, `AAAA-MM-DD`. */
export function campusToday(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: CAMPUS_TIMEZONE }).format(now);
}

/** Hora atual no campus, `HH:mm`. */
export function campusTimeNow(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: CAMPUS_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(now);
}

/** Data e hora do campus para o instante em UTC que a API espera. */
export function campusToUtcIso(date: string, time: string): string {
  return new Date(`${date}T${time}:00${CAMPUS_UTC_OFFSET}`).toISOString();
}

/** Instante da API (UTC) como hora do campus, `HH:mm`. */
export function campusTime(iso: string): string {
  return campusTimeNow(new Date(iso));
}

/**
 * Inícios possíveis: do dia escolhido (vazio se o campus não abre) ou, sem data, da faixa
 * mais larga da semana. Hoje, só o que ainda não começou.
 */
export function startOptions(
  date: string | null,
  weekly: WeeklyHours,
  now: Date = new Date(),
): string[] {
  const hours = date ? hoursOn(date, weekly) : widestHours(weekly);
  if (!hours) return [];
  const starts = marksBetween(hours.opening, hours.closing).slice(0, -1);
  if (date !== campusToday(now)) return starts;
  const current = campusTimeNow(now);
  return starts.filter((time) => isBefore(current, time));
}

export function endOptions(
  date: string | null,
  start: string | null,
  weekly: WeeklyHours,
): string[] {
  const hours = date ? hoursOn(date, weekly) : widestHours(weekly);
  if (!hours) return [];
  return marksBetween(hours.opening, hours.closing)
    .slice(1)
    .filter((time) => !start || isBefore(start, time));
}

/** "qua, 21 de out" (design system, seção 9). */
export function dayLabel(date: string): string {
  return dayjs(date).locale('pt-br').format('ddd, D [de] MMM');
}
