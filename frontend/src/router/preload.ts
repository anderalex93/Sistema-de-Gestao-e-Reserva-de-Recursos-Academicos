import { isValidElement } from 'react';
import { matchRoutes, type RouteObject } from 'react-router';

function hasPreload(value: unknown): value is { preload: () => Promise<unknown> } {
  return (
    (typeof value === 'object' || typeof value === 'function') &&
    value !== null &&
    'preload' in value &&
    typeof value.preload === 'function'
  );
}

/**
 * Começa a baixar as páginas da URL aberta junto com o bundle principal. Sem isso o chunk da
 * página só sai depois que a sessão (`/auth/me`) responde, numa cascata de requisições (RNF02).
 */
export function preloadPages(routes: RouteObject[], pathname: string): void {
  for (const { route } of matchRoutes(routes, pathname) ?? []) {
    const type: unknown = isValidElement(route.element) ? route.element.type : null;
    if (hasPreload(type)) void type.preload();
  }
}
