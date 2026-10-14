import { describe, expect, it } from 'vitest';

import { CONSENT_VERSION, ConsentStore } from '@/lib/analytics/consent-store';

const KEY = 'eduspace.cookies';

describe('ConsentStore', () => {
  it('starts without a choice', () => {
    expect(new ConsentStore().get()).toBeNull();
  });

  it('records the choice with the date and the version of the notice', () => {
    const store = new ConsentStore(KEY, () => new Date('2026-10-13T15:00:00Z'));

    store.set('granted');

    expect(store.get()).toBe('granted');
    expect(JSON.parse(window.localStorage.getItem(KEY) ?? '')).toEqual({
      escolha: 'granted',
      em: '2026-10-13T15:00:00.000Z',
      versao: CONSENT_VERSION,
    });
  });

  it('asks again when the notice changed version', () => {
    window.localStorage.setItem(
      KEY,
      JSON.stringify({ escolha: 'granted', em: '2026-01-01T00:00:00Z', versao: '2025-01-01' }),
    );

    expect(new ConsentStore().get()).toBeNull();
  });

  it('ignores anything that is not a valid record', () => {
    window.localStorage.setItem(KEY, 'granted');
    expect(new ConsentStore().get()).toBeNull();

    window.localStorage.setItem(
      KEY,
      JSON.stringify({ escolha: 'talvez', em: 'x', versao: CONSENT_VERSION }),
    );
    expect(new ConsentStore().get()).toBeNull();
  });
});
