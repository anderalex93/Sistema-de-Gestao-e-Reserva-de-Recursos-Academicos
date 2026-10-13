import { useContext } from 'react';

import { FeedbackContext, type FeedbackContextValue } from '@/contexts/feedback-context';

export function useFeedback(): FeedbackContextValue {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error('useFeedback precisa estar dentro de <FeedbackProvider>.');
  }
  return context;
}
