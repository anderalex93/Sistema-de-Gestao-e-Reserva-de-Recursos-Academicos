import { describe, expect, it } from 'vitest';

import { routePattern } from '@/hooks/usePageViews';

describe('routePattern', () => {
  it('replaces ids and receipt codes with the parameter names', () => {
    expect(routePattern('/recursos/12', { id: '12' })).toBe('/recursos/:id');
    expect(routePattern('/comprovantes/EDU-7K3F9Q', { codigo: 'EDU-7K3F9Q' })).toBe(
      '/comprovantes/:codigo',
    );
  });

  it('keeps fixed paths and hides unknown addresses behind a wildcard', () => {
    expect(routePattern('/minhas-reservas', {})).toBe('/minhas-reservas');
    expect(routePattern('/pagina/qualquer', { '*': 'pagina/qualquer' })).toBe('/*');
  });
});
