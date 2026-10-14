import { describe, expect, it } from 'vitest';

import { checkinNote } from '@/domain/checkin';
import { DEFAULT_RULES } from '@/domain/rules';
import { campusToUtcIso } from '@/domain/schedule';

const day = '2026-10-21';
const base = {
  status: 'CONFIRMADA' as const,
  inicio: campusToUtcIso(day, '19:00'),
  fim: campusToUtcIso(day, '21:00'),
  checkin_em: null,
  liberada_em: null,
};
const beforeStart = new Date(campusToUtcIso(day, '18:00'));

describe('checkinNote', () => {
  it('tells when to read the door QR for an upcoming reservation', () => {
    expect(checkinNote(base, DEFAULT_RULES, beforeStart)).toEqual({
      kind: 'pendente',
      text: 'Check-in pelo QR da porta entre 18:45 e 19:15',
    });
  });

  it('confirms the presence with the time', () => {
    const note = checkinNote(
      { ...base, checkin_em: campusToUtcIso(day, '18:52') },
      DEFAULT_RULES,
      beforeStart,
    );

    expect(note).toEqual({ kind: 'feito', text: 'Presença confirmada às 18:52' });
  });

  it('explains a reservation released for lack of check-in', () => {
    const note = checkinNote(
      { ...base, status: 'NAO_COMPARECEU', liberada_em: campusToUtcIso(day, '19:15') },
      DEFAULT_RULES,
    );

    expect(note).toEqual({
      kind: 'liberada',
      text: 'Liberada às 19:15: não houve check-in no prazo',
    });
  });

  it('says nothing for cancelled, finished or optional check-in reservations', () => {
    const afterEnd = new Date(campusToUtcIso(day, '21:30'));

    expect(checkinNote({ ...base, status: 'CANCELADA' }, DEFAULT_RULES, beforeStart)).toBeNull();
    expect(checkinNote(base, DEFAULT_RULES, afterEnd)).toBeNull();
    expect(checkinNote(base, { ...DEFAULT_RULES, checkinToleranceMin: 0 }, beforeStart)).toBeNull();
  });
});
