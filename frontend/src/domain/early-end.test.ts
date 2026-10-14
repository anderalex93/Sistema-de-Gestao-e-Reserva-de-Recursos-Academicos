import { describe, expect, it } from 'vitest';

import { freeFrom } from '@/domain/early-end';
import { campusToUtcIso } from '@/domain/schedule';

const day = '2026-10-21';
const reservation = { inicio: campusToUtcIso(day, '14:00'), fim: campusToUtcIso(day, '16:00') };
const at = (time: string, seconds = 0) =>
  new Date(Date.parse(campusToUtcIso(day, time)) + seconds * 1000);

describe('freeFrom', () => {
  it('rounds up to the next half hour', () => {
    expect(freeFrom(reservation, at('14:40'))).toBe(campusToUtcIso(day, '15:00'));
    expect(freeFrom(reservation, at('14:30', 1))).toBe(campusToUtcIso(day, '15:00'));
  });

  it('keeps an exact mark', () => {
    expect(freeFrom(reservation, at('15:00'))).toBe(campusToUtcIso(day, '15:00'));
  });

  it('never frees before the first half hour nor after the end', () => {
    expect(freeFrom(reservation, at('14:00'))).toBe(campusToUtcIso(day, '14:30'));
    expect(freeFrom(reservation, at('15:59'))).toBe(campusToUtcIso(day, '16:00'));
  });
});
