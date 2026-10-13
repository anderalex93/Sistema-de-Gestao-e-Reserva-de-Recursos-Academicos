import { render, screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AppProviders } from '@/App';
import AppLayout from '@/layouts/AppLayout';
import { PageError } from '@/pages/ErrorPage';
import { AuthRoot, RequireAuth } from '@/router/guards';
import { routes } from '@/router/routes';
import { serveCatalog } from '@/test/catalog';
import { api, createTestQueryClient, renderRoute, signIn } from '@/test/render';
import { server } from '@/test/server';

const RAW = /Network Error|Failed to fetch|TypeError|stack|\{"/;

afterEach(() => {
  vi.restoreAllMocks();
});

describe('API out of the air', () => {
  it('warns on the first failure instead of waiting for every retry', async () => {
    serveCatalog([]);
    let attempts = 0;
    server.use(
      http.get(api('/recursos'), () => {
        attempts += 1;
        return HttpResponse.error();
      }),
    );
    renderRoute('/reservar');

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Não foi possível conectar ao servidor');
    expect(within(alert).getByRole('button', { name: 'Tentar de novo' })).toBeVisible();
    // Ainda há repetições por trás: a mensagem não esperou todas acabarem.
    expect(attempts).toBeLessThan(3);
    expect(document.body.textContent).not.toMatch(RAW);
  });

  it('explains when the session cannot be restored', async () => {
    window.localStorage.setItem('eduspace.token', 'token-de-teste');
    server.use(http.get(api('/auth/me'), () => HttpResponse.error()));
    renderRoute('/minhas-reservas', { user: null });

    expect(
      await screen.findByRole('heading', { name: 'Não foi possível carregar sua sessão' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tentar de novo' })).toBeVisible();
    expect(document.body.textContent).not.toMatch(RAW);
  });
});

describe('unexpected page error', () => {
  function Broken(): never {
    throw new Error('falha interna com detalhe técnico');
  }

  it('keeps the navigation and hides the technical detail', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    signIn();
    const router = createMemoryRouter([
      {
        element: <AuthRoot />,
        children: [
          {
            element: <RequireAuth />,
            children: [
              {
                element: <AppLayout />,
                children: [
                  { errorElement: <PageError />, children: [{ index: true, element: <Broken /> }] },
                ],
              },
            ],
          },
        ],
      },
    ]);
    render(
      <AppProviders queryClient={createTestQueryClient()}>
        <RouterProvider router={router} />
      </AppProviders>,
    );

    expect(await screen.findByRole('heading', { level: 1, name: 'Algo deu errado' })).toBeVisible();
    expect(screen.getByRole('navigation', { name: 'Navegação principal' })).toBeInTheDocument();
    expect(document.body.textContent).not.toContain('detalhe técnico');
    expect(screen.getByRole('link', { name: 'Ir para o início' })).toHaveAttribute('href', '/');
  });

  it('is wired inside the app layout for every logged page', () => {
    const layout = routes[0]?.children?.[1]?.children?.[0];
    expect(layout?.children?.[0]?.errorElement).toBeDefined();
  });
});
