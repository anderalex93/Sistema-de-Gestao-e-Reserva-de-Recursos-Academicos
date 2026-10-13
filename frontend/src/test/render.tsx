import { QueryClient } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router';

import { AppProviders } from '@/App';
import { routes } from '@/router/routes';

export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } },
  });
}

/** Renderiza a aplicação inteira (providers + rotas reais) a partir de um caminho. */
export function renderRoute(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const user = userEvent.setup();
  const view = render(
    <AppProviders queryClient={createTestQueryClient()}>
      <RouterProvider router={router} />
    </AppProviders>,
  );
  return { ...view, router, user };
}

/** Renderiza um componente isolado com os providers globais. */
export function renderWithProviders(ui: ReactElement) {
  const user = userEvent.setup();
  const view = render(<AppProviders queryClient={createTestQueryClient()}>{ui}</AppProviders>);
  return { ...view, user };
}
