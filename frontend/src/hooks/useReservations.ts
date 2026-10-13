import { useQuery } from '@tanstack/react-query';

import { reservationsApi } from '@/lib/api';
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
