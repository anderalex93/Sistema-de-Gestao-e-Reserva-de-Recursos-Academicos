import type { TestInfo } from '@playwright/test';

const CAMPUS_TIMEZONE = 'America/Maceio';
// Maceió não tem horário de verão: o deslocamento é fixo.
const CAMPUS_OFFSET = '-03:00';

function campusDate(instant: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: CAMPUS_TIMEZONE }).format(instant);
}

function isWeekend(date: string): boolean {
  return [0, 6].includes(new Date(`${date}T12:00:00Z`).getUTCDay());
}

/**
 * Dia útil do teste (`AAAA-MM-DD`, no fuso do campus), a partir de amanhã. Segunda a sexta o
 * campus abre das 08:00 às 21:00. Cada nova tentativa (retry ou `--repeat-each`) usa o dia útil
 * seguinte, porque o banco é o mesmo e o horário da tentativa anterior já está reservado.
 */
export function testDay(info: TestInfo): string {
  let remaining = info.retry + info.repeatEachIndex;
  const day = new Date();
  for (;;) {
    day.setUTCDate(day.getUTCDate() + 1);
    if (isWeekend(campusDate(day))) continue;
    if (remaining === 0) return campusDate(day);
    remaining -= 1;
  }
}

/** Instante ISO de um horário do campus, como a API espera em `inicio` e `fim`. */
export function campusInstant(date: string, time: string): string {
  return `${date}T${time}:00${CAMPUS_OFFSET}`;
}
