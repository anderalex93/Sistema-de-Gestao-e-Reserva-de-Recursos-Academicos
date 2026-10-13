import { zodResolver } from '@hookform/resolvers/zod';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import { useId, useState } from 'react';
import { useForm } from 'react-hook-form';

import { DetailList } from '@/components/DetailList';
import { FormError } from '@/components/form/FormError';
import { FormTextField } from '@/components/form/FormTextField';
import { locationLabel } from '@/domain/resource-types';
import { campusTime } from '@/domain/schedule';
import { useAdminCancelReservation } from '@/hooks/useAdminAgenda';
import { useFeedback } from '@/hooks/useFeedback';
import type { AdminReservationRead } from '@/lib/api/types';
import { applyApiError } from '@/lib/form-errors';
import { adminCancellationSchema, type AdminCancellationForm } from '@/schemas/forms/reservation';

interface AdminCancelDialogProps {
  reservation: AdminReservationRead;
  onClose: () => void;
}

/** Cancelamento administrativo (#30): motivo obrigatório, mostrado ao dono no histórico. */
export function AdminCancelDialog({ reservation, onClose }: AdminCancelDialogProps) {
  const id = useId();
  const { notify } = useFeedback();
  const cancel = useAdminCancelReservation();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<AdminCancellationForm>({
    resolver: zodResolver(adminCancellationSchema),
    defaultValues: { motivo: '' },
  });

  const submit = ({ motivo }: AdminCancellationForm) => {
    setFormError(null);
    cancel.mutate(
      { id: reservation.id, motivo },
      {
        onSuccess: () => {
          notify({
            message: `Reserva de ${reservation.usuario.nome} cancelada. O horário ficou livre.`,
            severity: 'success',
          });
          onClose();
        },
        onError: (error) => applyApiError(error, { setError, fields: ['motivo'], setFormError }),
      },
    );
  };

  return (
    <Dialog
      open
      onClose={cancel.isPending ? undefined : onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby={`${id}-titulo`}
    >
      <DialogTitle id={`${id}-titulo`} sx={{ fontFamily: 'h2.fontFamily', fontWeight: 500 }}>
        Cancelar a reserva de {reservation.usuario.nome}?
      </DialogTitle>
      <form noValidate onSubmit={handleSubmit(submit)}>
        <DialogContent>
          <Stack spacing={2.5}>
            <FormError message={formError} />
            <DetailList
              items={[
                { label: 'Recurso', value: reservation.recurso.nome },
                { label: 'Local', value: locationLabel(reservation.recurso) },
                {
                  label: 'Horário',
                  value: `${campusTime(reservation.inicio)} às ${campusTime(reservation.fim)}`,
                },
                { label: 'Código', value: reservation.codigo },
              ]}
            />
            <FormTextField
              id={`${id}-motivo`}
              label="Motivo"
              multiline
              minRows={2}
              helperText="Aparece para quem reservou. Descreva o motivo do espaço, sem dados pessoais (ex.: manutenção, evento institucional)."
              registration={register('motivo')}
              error={errors.motivo?.message}
              required
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1, flexWrap: 'wrap' }}>
          <Button variant="outlined" onClick={onClose} disabled={cancel.isPending}>
            Manter reserva
          </Button>
          <Button type="submit" variant="contained" color="error" disabled={cancel.isPending}>
            {cancel.isPending ? 'Cancelando…' : 'Cancelar reserva'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
