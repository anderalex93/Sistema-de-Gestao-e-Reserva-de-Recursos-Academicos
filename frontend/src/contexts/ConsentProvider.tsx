import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import { ConsentContext, type ConsentContextValue } from '@/contexts/consent-context';
import type { Analytics } from '@/lib/analytics/analytics';
import type { ConsentChoice, ConsentStore } from '@/lib/analytics/consent-store';

interface ConsentProviderProps {
  analytics: Analytics;
  store: ConsentStore;
  children: ReactNode;
}

/** Consentimento de cookies não essenciais (LGPD, Art. 7º, I e Art. 8º). */
export function ConsentProvider({ analytics, store, children }: ConsentProviderProps) {
  const [choice, setChoice] = useState<ConsentChoice | null>(() => store.get());
  const [preferencesOpen, setPreferencesOpen] = useState(false);

  // Quem já aceitou em outra visita volta a ser medido sem ver o aviso de novo.
  useEffect(() => {
    if (choice) analytics.applyConsent(choice);
  }, [analytics, choice]);

  const choose = useCallback(
    (next: ConsentChoice) => {
      store.set(next);
      setChoice(next);
      setPreferencesOpen(false);
    },
    [store],
  );

  const openPreferences = useCallback(() => setPreferencesOpen(true), []);

  const value = useMemo<ConsentContextValue>(
    () => ({
      enabled: analytics.enabled,
      choice,
      bannerOpen: analytics.enabled && (choice === null || preferencesOpen),
      choose,
      openPreferences,
    }),
    [analytics.enabled, choice, preferencesOpen, choose, openPreferences],
  );

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
}
