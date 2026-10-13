import { describe, expect, it } from 'vitest';

import {
  activeFilterCount,
  EMPTY_SEARCH,
  parseSearch,
  toApiParams,
  toUrlParams,
} from '@/domain/resource-search';
import { campusToday, campusToUtcIso, endOptions, startOptions } from '@/domain/schedule';

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
          '&capacidade_min=0&data=amanha&inicio=19:10&fim=23:00&page=0',
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
  // 13/10/2026, 15:10 em Maceió.
  const now = new Date('2026-10-13T18:10:00Z');

  it('uses the campus timezone', () => {
    expect(campusToday(new Date('2026-10-14T02:00:00Z'))).toBe('2026-10-13');
    expect(campusToUtcIso('2026-10-13', '07:00')).toBe('2026-10-13T10:00:00.000Z');
  });

  it('offers only future starts today and every start on other days', () => {
    expect(startOptions('2026-10-13', now)[0]).toBe('15:30');
    expect(startOptions('2026-10-14', now)).toHaveLength(30);
    expect(startOptions('2026-10-14', now).at(-1)).toBe('21:30');
  });

  it('offers ends after the start, up to closing time', () => {
    expect(endOptions('21:00')).toEqual(['21:30', '22:00']);
    expect(endOptions(null)[0]).toBe('07:30');
  });
});
