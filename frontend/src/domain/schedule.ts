/** Horários do campus. Tudo é exibido no fuso de Maceió e enviado à API em UTC. */

export const CAMPUS_TIMEZONE = 'America/Maceio';
/** Maceió não tem horário de verão: UTC-3 o ano todo. */
const CAMPUS_UTC_OFFSET = '-03:00';

export const OPENING_TIME = '07:00';
export const CLOSING_TIME = '22:00';
export const SLOT_MINUTES = 30;

function toMinutes(time: string): number {
  const [hours = 0, minutes = 0] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function fromMinutes(total: number): string {
  const hours = String(Math.floor(total / 60)).padStart(2, '0');
  const minutes = String(total % 60).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/** Marcas de 30 em 30 minutos do horário de funcionamento, inclusive o fechamento. */
export const TIME_MARKS: readonly string[] = Array.from(
  { length: (toMinutes(CLOSING_TIME) - toMinutes(OPENING_TIME)) / SLOT_MINUTES + 1 },
  (_, index) => fromMinutes(toMinutes(OPENING_TIME) + index * SLOT_MINUTES),
);

export function isTimeMark(value: string): boolean {
  return TIME_MARKS.includes(value);
}

export function isBefore(a: string, b: string): boolean {
  return toMinutes(a) < toMinutes(b);
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

/** Inícios possíveis num dia: até meia hora antes do fechamento e, hoje, só o que não passou. */
export function startOptions(date: string | null, now: Date = new Date()): string[] {
  const starts = TIME_MARKS.slice(0, -1);
  if (date !== campusToday(now)) return starts;
  const current = campusTimeNow(now);
  return starts.filter((time) => isBefore(current, time));
}

export function endOptions(start: string | null): string[] {
  return TIME_MARKS.slice(1).filter((time) => !start || isBefore(start, time));
}
