import CloseSharp from '@mui/icons-material/CloseSharp';
import IconButton from '@mui/material/IconButton';
import Snackbar from '@mui/material/Snackbar';
import SnackbarContent from '@mui/material/SnackbarContent';
import { useCallback, useMemo, useState, type ReactNode } from 'react';

import { FeedbackContext, type FeedbackMessage } from '@/contexts/feedback-context';
import { colors, layout } from '@/theme/tokens';

interface ActiveFeedback extends Required<FeedbackMessage> {
  key: number;
}

const AUTO_HIDE_MS = 5_000;

/** Avisos globais. Sucesso e informação somem em 5s; erro fica até a pessoa fechar. */
export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<ActiveFeedback | null>(null);

  const notify = useCallback(({ message, severity = 'success' }: FeedbackMessage) => {
    setActive({ message, severity, key: Date.now() });
  }, []);

  const close = useCallback((_event?: unknown, reason?: string) => {
    if (reason !== 'clickaway') setActive(null);
  }, []);

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      <Snackbar
        key={active?.key}
        open={active !== null}
        onClose={close}
        autoHideDuration={active?.severity === 'error' ? null : AUTO_HIDE_MS}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        sx={{ bottom: { xs: layout.bottomNavHeight + 16, md: 24 } }}
      >
        <SnackbarContent
          role={active?.severity === 'error' ? 'alert' : 'status'}
          message={active?.message}
          sx={{ backgroundColor: colors.ink, color: colors.surface, borderRadius: '2px' }}
          action={
            <IconButton aria-label="Fechar aviso" onClick={close} sx={{ color: colors.surface }}>
              <CloseSharp fontSize="small" />
            </IconButton>
          }
        />
      </Snackbar>
    </FeedbackContext.Provider>
  );
}
