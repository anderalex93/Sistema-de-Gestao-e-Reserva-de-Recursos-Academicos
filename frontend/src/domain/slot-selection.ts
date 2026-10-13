/**
 * Seleção de um intervalo contínuo na grade: o primeiro clique marca o início (meia hora),
 * o segundo, num horário depois dele, estende até ali. Nunca atravessa um horário ocupado.
 */
import { campusTime } from '@/domain/schedule';
import type { SlotRead } from '@/lib/api/types';

/** Índices inclusivos na lista de slots do dia. */
export interface SlotRange {
  start: number;
  end: number;
}

function allFree(slots: readonly SlotRead[], start: number, end: number): boolean {
  return slots.slice(start, end + 1).every((slot) => slot.status === 'LIVRE');
}

export function selectSlot(
  slots: readonly SlotRead[],
  current: SlotRange | null,
  index: number,
): SlotRange | null {
  if (slots[index]?.status !== 'LIVRE') return current;
  if (current && current.start === current.end) {
    if (index === current.start) return null;
    if (index > current.start && allFree(slots, current.start, index)) {
      return { start: current.start, end: index };
    }
  }
  return { start: index, end: index };
}

export function isSelected(range: SlotRange | null, index: number): boolean {
  return range !== null && index >= range.start && index <= range.end;
}

/** Intervalo vindo da URL (`inicio`/`fim` em `HH:mm`), só se continuar livre. */
export function rangeFromTimes(
  slots: readonly SlotRead[],
  inicio: string | null,
  fim: string | null,
): SlotRange | null {
  if (!inicio || !fim) return null;
  const start = slots.findIndex((slot) => campusTime(slot.inicio) === inicio);
  const end = slots.findIndex((slot) => campusTime(slot.fim) === fim);
  if (start < 0 || end < start || !allFree(slots, start, end)) return null;
  return { start, end };
}

export interface SelectedInterval {
  /** ISO UTC, como a API devolve. */
  inicio: string;
  fim: string;
  minutes: number;
}

export function selectedInterval(
  slots: readonly SlotRead[],
  range: SlotRange | null,
): SelectedInterval | null {
  const first = range ? slots[range.start] : undefined;
  const last = range ? slots[range.end] : undefined;
  if (!first || !last) return null;
  const minutes = (Date.parse(last.fim) - Date.parse(first.inicio)) / 60_000;
  return { inicio: first.inicio, fim: last.fim, minutes };
}

/** "30 min", "1h", "1h30". */
export function durationLabel(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  return rest === 0 ? `${hours}h` : `${hours}h${String(rest).padStart(2, '0')}`;
}
