import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useRef, useState } from 'react';

import { DetailList } from '@/components/DetailList';
import { FormError } from '@/components/form/FormError';
import { freeFrom } from '@/domain/early-end';
import { locationLabel } from '@/domain/resource-types';
import { campusTime } from '@/domain/schedule';
import { useFeedback } from '@/hooks/useFeedback';
import { useEndReservationEarly } from '@/hooks/useReservations';
import { analytics } from '@/lib/analytics';
import { ApiError } from '@/lib/api/api-error';
import type { ReservationRead } from '@/lib/api/types';
import { focusIfIdle } from '@/lib/focus';

interface EndReservationDialogProps {
  reservation: ReservationRead;
  onClose: () => void;
}

/**
 * Encerrar o uso antes do fim: a pergunta vem antes, com a hora em que a sala fica livre, e a
 * ação segura (continuar usando) tem o foco.
 */
export function EndReservationDialog({ reservation, onClose }: EndReservationDialogProps) {
  const { notify } = useFeedback();
  const end = useEndReservationEarly();
  const [error, setError] = useState<string | null>(null);
  const keepButton = useRef<HTMLButtonElement>(null);
  // Trava síncrona contra clique duplo antes de o botão ser desabilitado.
  const submitting = useRef(false);
  const [freeAt] = useState(() => campusTime(freeFrom(reservation)));

  const confirm = () => {
    if (submitting.current) return;
    submitting.current = true;
    setError(null);
    end.mutate(reservation.id, {
      onSettled: () => {
        submitting.current = false;
      },
      onSuccess: (ended) => {
        analytics.track({ name: 'reservation_ended_early' });
        notify({
          message: `Uso encerrado. A sala ficou livre a partir das ${campusTime(ended.fim)}.`,
          severity: 'success',
        });
        onClose();
      },
      onError: (failure) => setError(ApiError.from(failure).message),
    });
  };

  return (
    <Dialog
      open
      onClose={end.isPending ? undefined : onClose}
      fullWidth
      maxWidth="xs"
      aria-labelledby="encerrar-uso-titulo"
      slotProps={{ transition: { onEntered: () => focusIfIdle(keepButton) } }}
    >
      <DialogTitle id="encerrar-uso-titulo" sx={{ fontFamily: 'h2.fontFamily', fontWeight: 500 }}>
        Encerrar o uso agora?
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <FormError message={error} />
          <DetailList
            items={[
              { label: 'Recurso', value: reservation.recurso.nome },
              { label: 'Local', value: locationLabel(reservation.recurso) },
              {
                label: 'Horário',
                value: `${campusTime(reservation.inicio)} às ${campusTime(reservation.fim)}`,
              },
            ]}
          />
          <Typography>A sala fica livre a partir das {freeAt}.</Typography>
          <Typography variant="body2" color="text.secondary">
            Outras pessoas já podem reservar o resto do horário. Não dá para desfazer.
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1, flexWrap: 'wrap' }}>
        <Button variant="outlined" onClick={onClose} disabled={end.isPending} ref={keepButton}>
          Continuar usando
        </Button>
        <Button variant="contained" onClick={confirm} disabled={end.isPending}>
          {end.isPending ? 'Encerrando…' : 'Sim, encerrar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
