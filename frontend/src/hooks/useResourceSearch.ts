import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';

import { parseSearch, toUrlParams, type ResourceSearch } from '@/domain/resource-search';

/** Filtros da busca lidos e gravados na query string da página. */
export function useResourceSearch() {
  const [params, setParams] = useSearchParams();
  const search = useMemo(() => parseSearch(params), [params]);

  /** Mudar qualquer filtro volta para a primeira página. */
  const update = useCallback(
    (patch: Partial<ResourceSearch>) =>
      setParams((current) => toUrlParams({ ...parseSearch(current), page: 1, ...patch }), {
        replace: true,
      }),
    [setParams],
  );

  const goToPage = useCallback(
    (page: number) => setParams((current) => toUrlParams({ ...parseSearch(current), page })),
    [setParams],
  );

  const clear = useCallback(() => setParams(new URLSearchParams(), { replace: true }), [setParams]);

  return { search, update, goToPage, clear };
}
