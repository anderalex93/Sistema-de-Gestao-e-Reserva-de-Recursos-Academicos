import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { reservationsApi } from '@/lib/api';
import type { MyReservationsParams } from '@/lib/api/reservations.api';
import { queryKeys } from '@/lib/query-keys';

/** Comprovante público: sempre busca de novo para mostrar a situação atual. */
export function useReceipt(codigo: string) {
  return useQuery({
    queryKey: queryKeys.receipt(codigo),
    queryFn: () => reservationsApi.receipt(codigo),
    staleTime: 0,
    enabled: codigo.length > 0,
  });
}

export function useMyReservations(params: MyReservationsParams) {
  return useQuery({
    queryKey: queryKeys.myReservations(params),
    queryFn: () => reservationsApi.listMine(params),
    staleTime: 0,
    placeholderData: keepPreviousData,
  });
}

/** Cancelar libera o horário: grade, busca, quadro e listas são recarregados. */
export function useCancelReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => reservationsApi.cancel(id),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.reservations }),
        queryClient.invalidateQueries({ queryKey: queryKeys.resources }),
      ]),
  });
}
