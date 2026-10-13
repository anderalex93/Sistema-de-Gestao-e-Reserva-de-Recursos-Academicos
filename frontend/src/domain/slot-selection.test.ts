import { describe, expect, it } from 'vitest';

import {
  durationLabel,
  rangeFromTimes,
  selectedInterval,
  selectSlot,
} from '@/domain/slot-selection';
import type { SlotRead } from '@/lib/api/types';
import { buildAvailability } from '@/test/catalog';

const DAY = '2030-10-23';

function slots(overrides: Record<string, Partial<SlotRead>> = {}): SlotRead[] {
  return buildAvailability(1, DAY, overrides).slots;
}

describe('slot selection', () => {
  const free = slots();

  it('starts, extends and resets the interval', () => {
    const first = selectSlot(free, null, 4);
    expect(first).toEqual({ start: 4, end: 4 });
    const extended = selectSlot(free, first, 6);
    expect(extended).toEqual({ start: 4, end: 6 });
    expect(selectSlot(free, extended, 1)).toEqual({ start: 1, end: 1 });
  });

  it('restarts when the second click is before the first', () => {
    expect(selectSlot(free, { start: 6, end: 6 }, 2)).toEqual({ start: 2, end: 2 });
  });

  it('ignores busy slots and never crosses them', () => {
    // 10:00 é o índice 4.
    const busy = slots({ '10:00': { status: 'OCUPADO' } });
    expect(selectSlot(busy, null, 4)).toBeNull();
    expect(selectSlot(busy, { start: 2, end: 2 }, 4)).toEqual({ start: 2, end: 2 });
    expect(selectSlot(busy, { start: 2, end: 2 }, 6)).toEqual({ start: 6, end: 6 });
  });

  it('reads an interval from HH:mm only while it is still free', () => {
    const all = slots();
    expect(rangeFromTimes(all, '19:00', '20:00')).toEqual({ start: 22, end: 23 });
    expect(rangeFromTimes(slots({ '19:30': { status: 'OCUPADO' } }), '19:00', '20:00')).toBeNull();
    expect(rangeFromTimes(all, '20:00', '19:00')).toBeNull();
    expect(rangeFromTimes(all, null, '19:00')).toBeNull();
  });

  it('describes the selected interval', () => {
    const interval = selectedInterval(slots(), { start: 22, end: 25 });
    expect(interval?.minutes).toBe(120);
    expect(interval?.inicio).toBe('2030-10-23T22:00:00.000Z');
    expect(selectedInterval(slots(), null)).toBeNull();
    expect([durationLabel(30), durationLabel(60), durationLabel(90)]).toEqual([
      '30 min',
      '1h',
      '1h30',
    ]);
  });
});
