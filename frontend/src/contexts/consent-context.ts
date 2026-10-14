import { createContext } from 'react';

import type { ConsentChoice } from '@/lib/analytics/consent-store';

export interface ConsentContextValue {
  /** Há medição configurada (sem ela não há o que consentir). */
  enabled: boolean;
  choice: ConsentChoice | null;
  /** O aviso está na tela: primeira visita ou "Preferências de cookies". */
  bannerOpen: boolean;
  choose: (choice: ConsentChoice) => void;
  openPreferences: () => void;
}

export const ConsentContext = createContext<ConsentContextValue | null>(null);
