import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { Analytics } from '@/lib/analytics/analytics';

const ID = 'G-TESTE123';

/** Comandos enviados ao gtag, como arrays (o gtag.js recebe o objeto `arguments`). */
function commands(): unknown[][] {
  return (window.dataLayer ?? []).map((entry) => Array.from(entry as ArrayLike<unknown>));
}

function gtagScripts(): HTMLScriptElement[] {
  return Array.from(document.querySelectorAll('script[src*="googletagmanager"]'));
}

beforeEach(() => {
  delete window.dataLayer;
});

afterEach(() => {
  for (const script of gtagScripts()) script.remove();
  document.cookie = '_ga=; Max-Age=0; path=/';
});

describe('Analytics', () => {
  it('stays inert without a measurement id', () => {
    const analytics = new Analytics(null);

    analytics.applyConsent('granted');
    analytics.pageView('/reservar');
    analytics.track({ name: 'login' });

    expect(analytics.enabled).toBe(false);
    expect(gtagScripts()).toHaveLength(0);
    expect(window.dataLayer).toBeUndefined();
  });

  it('loads nothing and sends nothing before consent', () => {
    const analytics = new Analytics(ID);

    analytics.pageView('/reservar');
    analytics.track({ name: 'login' });
    analytics.applyConsent('denied');

    expect(gtagScripts()).toHaveLength(0);
    expect(window.dataLayer).toBeUndefined();
  });

  it('loads gtag only after consent, with everything denied by default and no ad signals', () => {
    const analytics = new Analytics(ID);

    analytics.applyConsent('granted');

    const [script] = gtagScripts();
    expect(script?.src).toBe(`https://www.googletagmanager.com/gtag/js?id=${ID}`);
    const sent = commands();
    expect(sent[0]).toEqual([
      'consent',
      'default',
      expect.objectContaining({ analytics_storage: 'denied', ad_storage: 'denied' }),
    ]);
    expect(sent).toContainEqual([
      'config',
      ID,
      expect.objectContaining({
        send_page_view: false,
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
      }),
    ]);
    expect(sent).toContainEqual(['consent', 'update', { analytics_storage: 'granted' }]);
  });

  it('counts the page that was open when the person accepted', () => {
    const analytics = new Analytics(ID);
    analytics.pageView('/recursos/:id');

    analytics.applyConsent('granted');

    expect(commands()).toContainEqual([
      'event',
      'page_view',
      expect.objectContaining({ page_path: '/recursos/:id' }),
    ]);
  });

  it('sends product events after consent', () => {
    const analytics = new Analytics(ID);
    analytics.applyConsent('granted');

    analytics.track({
      name: 'reservation_created',
      params: { tipo_recurso: 'SALA_ESTUDO', duracao_min: 60 },
    });
    analytics.track({ name: 'reservation_cancelled' });

    const sent = commands();
    expect(sent).toContainEqual([
      'event',
      'reservation_created',
      { tipo_recurso: 'SALA_ESTUDO', duracao_min: 60 },
    ]);
    expect(sent).toContainEqual(['event', 'reservation_cancelled', {}]);
  });

  it('stops measuring and deletes the _ga cookies when consent is withdrawn', () => {
    const analytics = new Analytics(ID);
    analytics.applyConsent('granted');
    document.cookie = '_ga=GA1.1.123; path=/';

    analytics.applyConsent('denied');
    analytics.track({ name: 'login' });

    const sent = commands();
    expect(sent).toContainEqual(['consent', 'update', { analytics_storage: 'denied' }]);
    expect(sent).not.toContainEqual(['event', 'login', {}]);
    expect(document.cookie).not.toContain('_ga=');
  });
});
