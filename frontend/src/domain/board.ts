/**
 * Quadro de horários: cada recurso vira uma sequência de faixas contínuas do dia
 * (livre, ocupado, sua reserva, encerrado), a partir das ocupações que a API devolve.
 */
import { campusToUtcIso, SLOT_MINUTES } from '@/domain/schedule';
import type { BoardRead } from '@/lib/api/types';

export type SegmentKind = 'LIVRE' | 'OCUPADO' | 'PROPRIA' | 'PASSADO';

type Occupation = BoardRead['linhas'][number]['ocupacoes'][number];

export interface Segment {
  kind: SegmentKind;
  /** `HH:mm`, no fuso do campus. */
  start: string;
  end: string;
  /** Quantos blocos de 30 minutos a faixa ocupa. */
  span: number;
  reservadoPor: string | null;
}

export const segmentLabels: Record<SegmentKind, string> = {
  LIVRE: 'Livre',
  OCUPADO: 'Ocupado',
  PROPRIA: 'Sua reserva',
  PASSADO: 'Encerrado',
};

/** Inícios dos blocos de 30 minutos entre abertura e fechamento (`HH:mm`). */
export function boardMarks(opening: string, closing: string): string[] {
  const marks: string[] = [];
  const [oh = 0, om = 0] = opening.split(':').map(Number);
  const [ch = 0, cm = 0] = closing.split(':').map(Number);
  for (let minutes = oh * 60 + om; minutes < ch * 60 + cm; minutes += SLOT_MINUTES) {
    marks.push(
      `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`,
    );
  }
  return marks;
}

function addMinutes(time: string, minutes: number): string {
  const [hours = 0, mins = 0] = time.split(':').map(Number);
  const total = hours * 60 + mins + minutes;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export function rowSegments(
  date: string,
  marks: readonly string[],
  occupations: readonly Occupation[],
  now: Date = new Date(),
): Segment[] {
  const nowMs = now.getTime();
  const segments: Segment[] = [];
  let previousKey: string | null = null;

  for (const mark of marks) {
    const startMs = Date.parse(campusToUtcIso(date, mark));
    const endMs = startMs + SLOT_MINUTES * 60_000;
    const index = occupations.findIndex(
      (occupation) => Date.parse(occupation.inicio) < endMs && Date.parse(occupation.fim) > startMs,
    );
    const occupation = index >= 0 ? occupations[index] : undefined;
    const kind: SegmentKind =
      startMs < nowMs
        ? 'PASSADO'
        : occupation
          ? occupation.propria
            ? 'PROPRIA'
            : 'OCUPADO'
          : 'LIVRE';
    // Reservas vizinhas continuam separadas: a chave inclui qual ocupação é.
    const key = `${kind}:${kind === 'OCUPADO' || kind === 'PROPRIA' ? index : ''}`;
    const last = segments.at(-1);
    if (last && key === previousKey) {
      last.end = addMinutes(mark, SLOT_MINUTES);
      last.span += 1;
    } else {
      segments.push({
        kind,
        start: mark,
        end: addMinutes(mark, SLOT_MINUTES),
        span: 1,
        reservadoPor: occupation?.reservado_por ?? null,
      });
    }
    previousKey = key;
  }
  return segments;
}

export function describeSegment(segment: Segment): string {
  const who = segment.reservadoPor ? ` por ${segment.reservadoPor}` : '';
  return `${segment.start} às ${segment.end}, ${segmentLabels[segment.kind].toLowerCase()}${who}`;
}
