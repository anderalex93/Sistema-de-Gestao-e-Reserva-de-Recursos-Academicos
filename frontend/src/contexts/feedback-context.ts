import { createContext } from 'react';

export type FeedbackSeverity = 'success' | 'error' | 'info';

export interface FeedbackMessage {
  message: string;
  severity?: FeedbackSeverity;
}

export interface FeedbackContextValue {
  notify: (feedback: FeedbackMessage) => void;
}

export const FeedbackContext = createContext<FeedbackContextValue | null>(null);
