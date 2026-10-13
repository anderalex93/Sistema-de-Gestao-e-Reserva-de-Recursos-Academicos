import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { boardApi } from '@/lib/api';
import type { BoardParams } from '@/lib/api/board.api';
import { liveQueryOptions } from '@/lib/live-query';
import { queryKeys } from '@/lib/query-keys';

/** Fica sob a chave `recursos`: uma reserva nova invalida o quadro junto com a grade. */
export function useBoard(params: BoardParams) {
  return useQuery({
    queryKey: queryKeys.board(params),
    queryFn: () => boardApi.get(params),
    staleTime: 0,
    placeholderData: keepPreviousData,
    ...liveQueryOptions,
  });
}
