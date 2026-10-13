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
import { locationLabel } from '@/domain/resource-types';
import { campusTime, campusToday, dayLabel } from '@/domain/schedule';
import { useCancelReservation } from '@/hooks/useReservations';
import { useFeedback } from '@/hooks/useFeedback';
import { ApiError } from '@/lib/api/api-error';
import type { MyReservationRead } from '@/lib/api/types';

interface CancelReservationDialogProps {
  reservation: MyReservationRead;
  onClose: () => void;
}

/** História 03, CA1: a pergunta vem sempre antes do cancelamento; a ação segura tem o foco. */
export function CancelReservationDialog({ reservation, onClose }: CancelReservationDialogProps) {
  const { notify } = useFeedback();
  const cancel = useCancelReservation();
  const [error, setError] = useState<string | null>(null);
  const keepButton = useRef<HTMLButtonElement>(null);

  const confirm = () => {
    setError(null);
    cancel.mutate(reservation.id, {
      onSuccess: () => {
        notify({
          message: 'Reserva cancelada. O horário ficou livre de novo.',
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
      onClose={cancel.isPending ? undefined : onClose}
      fullWidth
      maxWidth="xs"
      aria-labelledby="cancelar-reserva-titulo"
      slotProps={{ transition: { onEntered: () => keepButton.current?.focus() } }}
    >
      <DialogTitle
        id="cancelar-reserva-titulo"
        sx={{ fontFamily: 'h2.fontFamily', fontWeight: 500 }}
      >
        Deseja cancelar esta reserva?
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <FormError message={error} />
          <DetailList
            items={[
              { label: 'Recurso', value: reservation.recurso.nome },
              { label: 'Local', value: locationLabel(reservation.recurso) },
              { label: 'Data', value: dayLabel(campusToday(new Date(reservation.inicio))) },
              {
                label: 'Horário',
                value: `${campusTime(reservation.inicio)} às ${campusTime(reservation.fim)}`,
              },
              { label: 'Código', value: reservation.codigo },
            ]}
          />
          <Typography variant="body2" color="text.secondary">
            O horário fica livre para outras pessoas na hora. Não dá para desfazer.
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1, flexWrap: 'wrap' }}>
        <Button variant="outlined" onClick={onClose} disabled={cancel.isPending} ref={keepButton}>
          Manter reserva
        </Button>
        <Button variant="contained" color="error" onClick={confirm} disabled={cancel.isPending}>
          {cancel.isPending ? 'Cancelando…' : 'Sim, cancelar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
