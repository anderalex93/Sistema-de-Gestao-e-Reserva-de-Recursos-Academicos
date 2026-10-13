import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { adminReservationsApi } from '@/lib/api';
import type { AgendaParams } from '@/lib/api/admin-reservations.api';
import { queryKeys } from '@/lib/query-keys';

/** A agenda muda a cada reserva feita ou cancelada: sem cache longo. */
export function useAdminAgenda(params: AgendaParams) {
  return useQuery({
    queryKey: queryKeys.adminAgenda(params),
    queryFn: () => adminReservationsApi.agenda(params),
    staleTime: 0,
    placeholderData: keepPreviousData,
  });
}

/** Cancelar libera o horário: agenda, listas, grade, busca e quadro são recarregados. */
export function useAdminCancelReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, motivo }: { id: number; motivo: string }) =>
      adminReservationsApi.cancel(id, motivo),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.reservations }),
        queryClient.invalidateQueries({ queryKey: queryKeys.resources }),
      ]),
  });
}
