import { useEffect } from 'react';
import { useLocation, useMatches, type Params } from 'react-router';

import { analytics } from '@/lib/analytics';

/**
 * Caminho com os parâmetros no lugar dos valores: `/recursos/12` vira `/recursos/:id` e
 * `/comprovantes/EDU-7K3F9Q` vira `/comprovantes/:codigo`. O código do comprovante e qualquer
 * query string ficam fora do Analytics.
 */
export function routePattern(pathname: string, params: Params): string {
  let pattern = pathname;
  for (const [key, value] of Object.entries(params)) {
    if (!value) continue;
    pattern = pattern.replace(`/${value}`, key === '*' ? '/*' : `/:${key}`);
  }
  return pattern;
}

/** Uma page view a cada troca de rota (só envia se a pessoa aceitou os cookies). */
export function usePageViews(): void {
  const { pathname } = useLocation();
  const matches = useMatches();
  const params = matches.at(-1)?.params ?? {};
  const route = routePattern(pathname, params);

  useEffect(() => {
    analytics.pageView(route);
  }, [route]);
}
