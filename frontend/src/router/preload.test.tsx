import type { RouteObject } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { preloadPages } from '@/router/preload';

function fakePage() {
  const preload = vi.fn<() => Promise<unknown>>(() => Promise.resolve({ default: () => null }));
  return { Page: Object.assign(() => null, { preload }), preload };
}

describe('preloadPages', () => {
  it('starts loading only the pages that match the opened URL', () => {
    const layout = fakePage();
    const resource = fakePage();
    const board = fakePage();
    const routes: RouteObject[] = [
      {
        element: <layout.Page />,
        children: [
          { path: 'recursos/:id', element: <resource.Page /> },
          { path: 'quadro', element: <board.Page /> },
        ],
      },
    ];

    preloadPages(routes, '/recursos/12');

    expect(layout.preload).toHaveBeenCalledOnce();
    expect(resource.preload).toHaveBeenCalledOnce();
    expect(board.preload).not.toHaveBeenCalled();
  });

  it('ignores routes without a preloadable element and unknown URLs', () => {
    const routes: RouteObject[] = [{ path: 'login', element: <p>login</p> }];

    expect(() => preloadPages(routes, '/login')).not.toThrow();
    expect(() => preloadPages(routes, '/nao-existe')).not.toThrow();
  });
});
