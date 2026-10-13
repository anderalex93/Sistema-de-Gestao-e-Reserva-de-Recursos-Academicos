import { QueryClient } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import type { ReactElement } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router';

import { AppProviders } from '@/App';
import { config } from '@/config';
import type { UserRead } from '@/lib/api/types';
import { routes } from '@/router/routes';
import { server } from '@/test/server';

export const api = (path: string) => `${config.apiUrl}${path}`;

export function buildUser(overrides: Partial<UserRead> = {}): UserRead {
  return {
    id: 1,
    nome: 'Lucas Andrade',
    email: 'lucas@umj.edu.br',
    perfil: 'ALUNO',
    matricula: null,
    ativo: true,
    criado_em: '2026-10-13T12:00:00Z',
    aceite_termos_em: '2026-10-13T12:00:00Z',
    ...overrides,
  };
}

export const adminUser = buildUser({
  id: 99,
  nome: 'Admin EduSpace',
  email: 'admin@umj.edu.br',
  perfil: 'ADMIN',
});

export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } },
  });
}

/** Simula uma sessão ativa: token salvo e `/auth/me` respondendo com o usuário. */
export function signIn(user: UserRead = buildUser()) {
  window.localStorage.setItem('eduspace.token', 'token-de-teste');
  server.use(http.get(api('/auth/me'), () => HttpResponse.json(user)));
}

interface RenderRouteOptions {
  /** Usuário logado; `null` para visitante. */
  user?: UserRead | null;
}

/** Renderiza a aplicação inteira (providers + rotas reais) a partir de um caminho. */
export function renderRoute(path: string, { user = buildUser() }: RenderRouteOptions = {}) {
  if (user) signIn(user);
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const user$ = userEvent.setup({ delay: null });
  const view = render(
    <AppProviders queryClient={createTestQueryClient()}>
      <RouterProvider router={router} />
    </AppProviders>,
  );
  return { ...view, router, user: user$ };
}

/** Renderiza um componente isolado com os providers globais. */
export function renderWithProviders(ui: ReactElement) {
  const user = userEvent.setup({ delay: null });
  const view = render(<AppProviders queryClient={createTestQueryClient()}>{ui}</AppProviders>);
  return { ...view, user };
}
