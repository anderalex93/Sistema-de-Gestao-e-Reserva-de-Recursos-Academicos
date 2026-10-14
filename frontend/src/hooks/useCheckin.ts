import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { checkinApi } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

/** O que a pessoa encontra ao ler o QR da porta: sempre a situação atual. */
export function useCheckinStatus(token: string) {
  return useQuery({
    queryKey: queryKeys.checkin(token),
    queryFn: () => checkinApi.status(token),
    staleTime: 0,
    enabled: token.length > 0,
  });
}

/** Confirmar presença muda a reserva: listas, comprovante e situação do check-in recarregam. */
export function useCheckIn(token: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => checkinApi.checkIn(token),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.reservations }),
  });
}
