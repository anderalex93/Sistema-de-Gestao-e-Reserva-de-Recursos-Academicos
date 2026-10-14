import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CookieBanner } from '@/components/legal/CookieBanner';
import { ConsentProvider } from '@/contexts/ConsentProvider';
import { useConsent } from '@/hooks/useConsent';
import { Analytics } from '@/lib/analytics/analytics';
import { ConsentStore } from '@/lib/analytics/consent-store';

function PreferencesLink() {
  const { openPreferences } = useConsent();
  return (
    <button type="button" onClick={openPreferences}>
      Preferências de cookies
    </button>
  );
}

function renderBanner(measurementId: string | null) {
  const analytics = new Analytics(measurementId);
  const applyConsent = vi.spyOn(analytics, 'applyConsent');
  const store = new ConsentStore();
  render(
    <MemoryRouter>
      <ConsentProvider analytics={analytics} store={store}>
        <PreferencesLink />
        <CookieBanner />
      </ConsentProvider>
    </MemoryRouter>,
  );
  return { applyConsent, store, user: userEvent.setup() };
}

const banner = () => screen.queryByRole('region', { name: 'Cookies de medição' });

afterEach(() => {
  for (const script of document.querySelectorAll('script[src*="googletagmanager"]')) {
    script.remove();
  }
  delete window.dataLayer;
});

describe('CookieBanner', () => {
  it('does not show up when there is no measurement configured', () => {
    renderBanner(null);

    expect(banner()).toBeNull();
  });

  it('asks on the first visit, with accept and decline side by side and the privacy notice', () => {
    renderBanner('G-TESTE123');

    expect(banner()).toBeVisible();
    expect(screen.getByRole('button', { name: 'Aceitar' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Recusar' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Aviso de Privacidade' })).toHaveAttribute(
      'href',
      '/privacidade',
    );
  });

  it('starts measuring only after accept and remembers the choice', async () => {
    const { applyConsent, store, user } = renderBanner('G-TESTE123');
    expect(applyConsent).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Aceitar' }));

    expect(applyConsent).toHaveBeenCalledWith('granted');
    expect(store.get()).toBe('granted');
    expect(banner()).toBeNull();
  });

  it('lets the person change their mind from the preferences link', async () => {
    const { applyConsent, store, user } = renderBanner('G-TESTE123');
    await user.click(screen.getByRole('button', { name: 'Aceitar' }));

    await user.click(screen.getByRole('button', { name: 'Preferências de cookies' }));
    await user.click(screen.getByRole('button', { name: 'Recusar' }));

    expect(applyConsent).toHaveBeenLastCalledWith('denied');
    expect(store.get()).toBe('denied');
    expect(banner()).toBeNull();
  });
});
