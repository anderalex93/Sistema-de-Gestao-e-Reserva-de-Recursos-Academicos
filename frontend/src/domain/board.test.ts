import { describe, expect, it } from 'vitest';

import { boardMarks, describeSegment, rowSegments } from '@/domain/board';
import { campusToUtcIso } from '@/domain/schedule';

const DAY = '2030-10-23';
const marks = boardMarks('08:00', '21:00');

function occupation(start: string, end: string, extra: Partial<{ propria: boolean }> = {}) {
  return {
    inicio: campusToUtcIso(DAY, start),
    fim: campusToUtcIso(DAY, end),
    propria: false,
    reservado_por: null,
    ...extra,
  };
}

describe('board segments', () => {
  it('builds the half-hour marks of the day', () => {
    expect(marks).toHaveLength(26);
    expect([marks[0], marks.at(-1)]).toEqual(['08:00', '20:30']);
    expect(boardMarks('08:00', '12:00')).toHaveLength(8);
  });

  it('merges free and occupied runs, keeping neighbouring reservations apart', () => {
    const before = new Date('2030-10-01T00:00:00Z');
    const segments = rowSegments(
      DAY,
      marks,
      [occupation('19:00', '20:00'), occupation('20:00', '20:30', { propria: true })],
      before,
    );

    expect(
      segments.map((segment) => [segment.kind, segment.start, segment.end, segment.span]),
    ).toEqual([
      ['LIVRE', '08:00', '19:00', 22],
      ['OCUPADO', '19:00', '20:00', 2],
      ['PROPRIA', '20:00', '20:30', 1],
      ['LIVRE', '20:30', '21:00', 1],
    ]);
  });

  it('marks what already started today as past', () => {
    const tenPast = new Date(campusToUtcIso(DAY, '10:10'));

    const [first, second] = rowSegments(DAY, marks, [], tenPast);

    expect([first?.kind, first?.end, second?.kind, second?.start]).toEqual([
      'PASSADO',
      '10:30',
      'LIVRE',
      '10:30',
    ]);
  });

  it('describes a segment for screen readers', () => {
    expect(
      describeSegment({
        kind: 'OCUPADO',
        start: '19:00',
        end: '20:00',
        span: 2,
        reservadoPor: 'Maria',
      }),
    ).toBe('19:00 às 20:00, ocupado por Maria');
  });
});
