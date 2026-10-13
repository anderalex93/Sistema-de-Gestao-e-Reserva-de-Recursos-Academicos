import type { UseQueryResult } from '@tanstack/react-query';

type QueryState = Pick<
  UseQueryResult<unknown>,
  'data' | 'error' | 'failureCount' | 'failureReason'
>;

/**
 * O erro que deve aparecer no lugar do conteúdo, ou `null`.
 *
 * Com a API fora do ar, cada tentativa pode levar até o timeout do cliente, e o TanStack só marca
 * `isError` depois de todas as repetições: a pessoa ficaria quase um minuto olhando um skeleton.
 * Aqui o aviso aparece já na primeira falha, e as repetições continuam por trás (#36).
 */
export function loadFailure(query: QueryState): unknown {
  if (query.data !== undefined) return null;
  if (query.error) return query.error;
  return query.failureCount > 0 ? query.failureReason : null;
}
