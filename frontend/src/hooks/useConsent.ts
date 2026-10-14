import { useContext } from 'react';

import { ConsentContext, type ConsentContextValue } from '@/contexts/consent-context';

export function useConsent(): ConsentContextValue {
  const context = useContext(ConsentContext);
  if (!context) {
    throw new Error('useConsent precisa estar dentro de <ConsentProvider>.');
  }
  return context;
}
