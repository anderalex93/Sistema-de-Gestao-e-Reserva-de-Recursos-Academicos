import { useCallback, useLayoutEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router';

import { parseSearch, toUrlParams, type ResourceSearch } from '@/domain/resource-search';

/** Filtros da busca lidos e gravados na query string da página. */
export function useResourceSearch() {
  const [params, setParams] = useSearchParams();
  const search = useMemo(() => parseSearch(params), [params]);

  // O `current` do setParams funcional é o da última renderização: duas mudanças seguidas
  // (o nome digitado aplicado com atraso e um clique num filtro) fariam a segunda apagar a
  // primeira. A ref guarda a última query string gravada, mesmo antes da nova renderização.
  const latest = useRef(params);
  useLayoutEffect(() => {
    latest.current = params;
  }, [params]);

  const write = useCallback(
    (next: URLSearchParams, replace: boolean) => {
      latest.current = next;
      setParams(next, { replace });
    },
    [setParams],
  );

  /** Mudar qualquer filtro volta para a primeira página. */
  const update = useCallback(
    (patch: Partial<ResourceSearch>) =>
      write(toUrlParams({ ...parseSearch(latest.current), page: 1, ...patch }), true),
    [write],
  );

  const goToPage = useCallback(
    (page: number) => write(toUrlParams({ ...parseSearch(latest.current), page }), false),
    [write],
  );

  const clear = useCallback(() => write(new URLSearchParams(), true), [write]);

  return { search, update, goToPage, clear };
}
