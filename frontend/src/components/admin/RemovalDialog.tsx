import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import { useId, useRef, useState, type ReactNode } from 'react';

import { FormError } from '@/components/form/FormError';
import { useCatalogMutation } from '@/hooks/useAdminCatalog';
import { ApiError } from '@/lib/api/api-error';
import { focusIfIdle } from '@/lib/focus';

const FUTURE_RESERVATIONS = 'RESERVAS_FUTURAS';

interface RemovalDialogProps<Result> {
  /** Pergunta direta: "Remover Sala 101?". */
  title: string;
  children: ReactNode;
  confirmLabel: string;
  /** `force` só vai como `true` depois que a pessoa viu quantas reservas serão canceladas. */
  remove: (force: boolean) => Promise<Result>;
  onRemoved: (result: Result) => void;
  onClose: () => void;
}

/**
 * Confirmação de exclusão (ADR 0002). Um `409 RESERVAS_FUTURAS` é uma pergunta, não um erro:
 * o diálogo mostra quantas reservas seriam canceladas e troca a ação para confirmá-las.
 */
export function RemovalDialog<Result>({
  title,
  children,
  confirmLabel,
  remove,
  onRemoved,
  onClose,
}: RemovalDialogProps<Result>) {
  const titleId = useId();
  const keepButton = useRef<HTMLButtonElement>(null);
  const submitting = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [futureWarning, setFutureWarning] = useState<string | null>(null);
  const mutation = useCatalogMutation(remove);

  const confirm = () => {
    if (submitting.current) return;
    submitting.current = true;
    setError(null);
    mutation.mutate(futureWarning !== null, {
      onSettled: () => {
        submitting.current = false;
      },
      onSuccess: onRemoved,
      onError: (failure) => {
        const apiError = ApiError.from(failure);
        if (apiError.code === FUTURE_RESERVATIONS) {
          setFutureWarning(apiError.message);
        } else {
          setError(apiError.message);
        }
      },
    });
  };

  return (
    <Dialog
      open
      onClose={mutation.isPending ? undefined : onClose}
      fullWidth
      maxWidth="xs"
      aria-labelledby={titleId}
      slotProps={{ transition: { onEntered: () => focusIfIdle(keepButton) } }}
    >
      <DialogTitle id={titleId} sx={{ fontFamily: 'h2.fontFamily', fontWeight: 500 }}>
        {title}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <FormError message={error} />
          {children}
          {futureWarning && (
            <Alert severity="warning" variant="outlined" role="alert">
              {futureWarning} Quem reservou vê a reserva cancelada no histórico.
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1, flexWrap: 'wrap' }}>
        <Button variant="outlined" onClick={onClose} disabled={mutation.isPending} ref={keepButton}>
          Voltar
        </Button>
        <Button variant="contained" color="error" onClick={confirm} disabled={mutation.isPending}>
          {mutation.isPending
            ? 'Removendo…'
            : futureWarning
              ? 'Cancelar reservas e desativar'
              : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
