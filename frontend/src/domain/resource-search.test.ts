import { describe, expect, it } from 'vitest';

import {
  activeFilterCount,
  EMPTY_SEARCH,
  parseSearch,
  toApiParams,
  toUrlParams,
} from '@/domain/resource-search';
import {
  campusToday,
  campusToUtcIso,
  DEFAULT_WEEKLY_HOURS,
  endOptions,
  hoursOn,
  startOptions,
  weeklyHoursFrom,
} from '@/domain/schedule';

describe('resource search', () => {
  it('reads every filter from the URL and writes it back unchanged', () => {
    const url =
      'bloco_id=1&tipo=LABORATORIO&caracteristicas=2&caracteristicas=1&capacidade_min=10' +
      '&busca=redes&data=2026-10-21&inicio=19%3A00&fim=21%3A00&page=2';

    const search = parseSearch(new URLSearchParams(url));

    expect(search).toEqual({
      bloco_id: 1,
      tipo: 'LABORATORIO',
      caracteristicas: [2, 1],
      capacidade_min: 10,
      busca: 'redes',
      data: '2026-10-21',
      inicio: '19:00',
      fim: '21:00',
      page: 2,
    });
    expect(toUrlParams(search).toString()).toBe(url);
    expect(activeFilterCount(search)).toBe(6);
  });

  it('ignores garbage in the URL', () => {
    const search = parseSearch(
      new URLSearchParams(
        'bloco_id=-1&tipo=PISCINA&caracteristicas=x&caracteristicas=3&caracteristicas=3' +
          '&capacidade_min=0&data=amanha&inicio=19:10&fim=24:00&page=0',
      ),
    );

    expect(search).toEqual({ ...EMPTY_SEARCH, caracteristicas: [3] });
  });

  it('sends the time window in UTC only when it is complete', () => {
    const complete = { ...EMPTY_SEARCH, data: '2026-10-21', inicio: '19:00', fim: '21:00' };

    expect(toApiParams(complete, 24)).toEqual({
      page: 1,
      per_page: 24,
      inicio: '2026-10-21T22:00:00.000Z',
      fim: '2026-10-22T00:00:00.000Z',
    });
    expect(toApiParams({ ...complete, fim: null }, 24)).toEqual({ page: 1, per_page: 24 });
    expect(toApiParams({ ...complete, fim: '18:00' }, 24)).toEqual({ page: 1, per_page: 24 });
  });
});

describe('schedule', () => {
  // Terça, 13/10/2026, 15:10 em Maceió.
  const now = new Date('2026-10-13T18:10:00Z');
  const weekly = DEFAULT_WEEKLY_HOURS;

  it('uses the campus timezone', () => {
    expect(campusToday(new Date('2026-10-14T02:00:00Z'))).toBe('2026-10-13');
    expect(campusToUtcIso('2026-10-13', '07:00')).toBe('2026-10-13T10:00:00.000Z');
  });

  it('follows the opening hours of each weekday', () => {
    expect(startOptions('2026-10-14', weekly, now)).toHaveLength(26);
    expect(startOptions('2026-10-14', weekly, now).at(-1)).toBe('20:30');
    expect(startOptions('2026-10-17', weekly, now)).toEqual([
      '08:00',
      '08:30',
      '09:00',
      '09:30',
      '10:00',
      '10:30',
      '11:00',
      '11:30',
    ]);
    expect(startOptions('2026-10-18', weekly, now)).toEqual([]);
    expect(hoursOn('2026-10-18', weekly)).toBeNull();
  });

  it('offers only future starts today', () => {
    expect(startOptions('2026-10-13', weekly, now)[0]).toBe('15:30');
  });

  it('uses the widest weekly range when there is no date', () => {
    expect(startOptions(null, weekly, now)[0]).toBe('08:00');
    expect(endOptions(null, null, weekly).at(-1)).toBe('21:00');
  });

  it('offers ends after the start, up to closing time of that day', () => {
    expect(endOptions('2026-10-14', '20:00', weekly)).toEqual(['20:30', '21:00']);
    expect(endOptions('2026-10-17', '11:00', weekly)).toEqual(['11:30', '12:00']);
  });

  it('builds the weekly hours from the API rules', () => {
    const hours = weeklyHoursFrom({
      fuso: 'America/Maceio',
      intervalo_minutos: 30,
      horarios: [{ dia_semana: 6, abertura: '08:00:00', fechamento: '12:00:00' }],
    });
    expect([...hours]).toEqual([[6, { opening: '08:00', closing: '12:00' }]]);
  });
});
