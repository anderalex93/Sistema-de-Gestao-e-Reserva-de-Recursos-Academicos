import { zodResolver } from '@hookform/resolvers/zod';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';

import { FeatureChips } from '@/components/catalog/FeatureChips';
import { DetailList } from '@/components/DetailList';
import { FormError } from '@/components/form/FormError';
import { FormTextField } from '@/components/form/FormTextField';
import { capacityLabel, locationLabel, resourceTypeLabels } from '@/domain/resource-types';
import { campusTime, dayLabel } from '@/domain/schedule';
import { durationLabel, type SelectedInterval } from '@/domain/slot-selection';
import { useFeedback } from '@/hooks/useFeedback';
import { reservationsApi } from '@/lib/api';
import { ApiError } from '@/lib/api/api-error';
import { focusIfIdle } from '@/lib/focus';
import type { ResourceRead } from '@/lib/api/types';
import { queryKeys } from '@/lib/query-keys';
import { paths } from '@/router/paths';
import {
  reservationSchema,
  type ReservationFormInput,
  type ReservationFormOutput,
} from '@/schemas/forms/reservation';

const EMPTY: ReservationFormInput = { finalidade: '', qtd_participantes: '' };

interface ReservationDialogProps {
  open: boolean;
  resource: ResourceRead;
  date: string;
  interval: SelectedInterval;
  onClose: () => void;
  /** O horário foi tomado por outra pessoa: a grade precisa ser atualizada. */
  onConflict: () => void;
}

/** Resumo antes de confirmar (História 02, CA2). Um clique confirma; o 409 volta para a grade. */
export function ReservationDialog({
  open,
  resource,
  date,
  interval,
  onClose,
  onConflict,
}: ReservationDialogProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { notify } = useFeedback();
  const [formError, setFormError] = useState<string | null>(null);
  const backButton = useRef<HTMLButtonElement>(null);
  // Trava síncrona: dois cliques no mesmo instante chegam antes de o botão ser desabilitado.
  const submitting = useRef(false);
  const schema = useMemo(() => reservationSchema(resource.capacidade), [resource.capacidade]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ReservationFormInput, unknown, ReservationFormOutput>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY,
  });

  const close = () => {
    reset(EMPTY);
    setFormError(null);
    onClose();
  };

  const mutation = useMutation({
    mutationFn: (values: ReservationFormOutput) =>
      reservationsApi.create({
        recurso_id: resource.id,
        inicio: interval.inicio,
        fim: interval.fim,
        ...values,
      }),
    onSuccess: async (reservation) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.resources }),
        queryClient.invalidateQueries({ queryKey: queryKeys.reservations }),
      ]);
      notify({ message: 'Reserva confirmada.', severity: 'success' });
      void navigate(paths.receipt(reservation.codigo));
    },
    onError: async (error) => {
      const apiError = ApiError.from(error);
      if (apiError.code === 'RESERVA_CONFLITO') {
        close();
        notify({ message: apiError.message, severity: 'error' });
        await queryClient.invalidateQueries({ queryKey: queryKeys.resources });
        onConflict();
        return;
      }
      setFormError(apiError.message);
    },
  });

  const confirm = (values: ReservationFormOutput) => {
    if (submitting.current) return;
    submitting.current = true;
    setFormError(null);
    mutation.mutate(values, {
      onSettled: () => {
        submitting.current = false;
      },
    });
  };

  const capacity = capacityLabel(resource);
  const summary = [
    { label: 'Recurso', value: `${resource.nome} (${resourceTypeLabels[resource.tipo]})` },
    { label: 'Local', value: locationLabel(resource) },
    { label: 'Data', value: dayLabel(date) },
    {
      label: 'Horário',
      value: `${campusTime(interval.inicio)} às ${campusTime(interval.fim)}`,
    },
    { label: 'Duração', value: durationLabel(interval.minutes) },
    ...(capacity ? [{ label: 'Capacidade', value: capacity }] : []),
    ...(resource.caracteristicas.length > 0
      ? [
          {
            label: 'Características',
            value: <FeatureChips features={resource.caracteristicas} label="Características" />,
          },
        ]
      : []),
  ];

  return (
    <Dialog
      open={open}
      onClose={mutation.isPending ? undefined : close}
      fullWidth
      maxWidth="sm"
      aria-labelledby="resumo-reserva-titulo"
      // Foco inicial na ação segura (design system, diálogo de confirmação).
      slotProps={{ transition: { onEntered: () => focusIfIdle(backButton) } }}
    >
      <DialogTitle id="resumo-reserva-titulo" sx={{ fontFamily: 'h2.fontFamily', fontWeight: 500 }}>
        Confirmar reserva?
      </DialogTitle>
      <form noValidate onSubmit={(event) => void handleSubmit(confirm)(event)}>
        <DialogContent>
          <Stack spacing={2.5}>
            <FormError message={formError} />
            <DetailList items={summary} />
            <FormTextField
              id="reserva-finalidade"
              label="Finalidade (opcional)"
              placeholder="Ex.: Reunião do Projeto Integrador"
              registration={register('finalidade')}
              error={errors.finalidade?.message}
            />
            {resource.capacidade !== null && (
              <FormTextField
                id="reserva-participantes"
                label="Participantes (opcional)"
                inputMode="numeric"
                registration={register('qtd_participantes')}
                error={errors.qtd_participantes?.message}
                helperText={`Até ${resource.capacidade} pessoas.`}
                sx={{ maxWidth: 200 }}
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1, flexWrap: 'wrap' }}>
          <Button variant="outlined" onClick={close} disabled={mutation.isPending} ref={backButton}>
            Voltar
          </Button>
          <Button type="submit" variant="contained" disabled={mutation.isPending}>
            {mutation.isPending ? 'Confirmando…' : 'Confirmar reserva'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
