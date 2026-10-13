import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { adminUser, renderRoute } from '@/test/render';

describe('routes', () => {
  it.each([
    ['/', 'Início'],
    ['/reservar', 'Reservar espaço'],
    ['/recursos/204', 'Recurso 204'],
    ['/minhas-reservas', 'Minhas reservas'],
    ['/conta', 'Minha conta'],
    ['/admin', 'Administração'],
    ['/login', 'Entrar'],
    ['/cadastro', 'Criar conta'],
    ['/comprovantes/EDU-7K3F9Q', 'Comprovante EDU-7K3F9Q'],
  ])('%s renders "%s" with a unique document title', async (path, title) => {
    const publicPage = ['/login', '/cadastro'].includes(path);
    renderRoute(path, { user: publicPage ? null : adminUser });

    expect(await screen.findByRole('heading', { level: 1, name: title })).toBeInTheDocument();
    await waitFor(() => expect(document.title).toBe(`${title} · EduSpace`));
  });

  it('shows a friendly 404 for unknown paths', async () => {
    renderRoute('/rota-que-nao-existe');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Página não encontrada' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ir para o início' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Reservar espaço' })).toHaveAttribute(
      'href',
      '/reservar',
    );
  });

  it('shows breadcrumbs on second-level pages', async () => {
    renderRoute('/recursos/204');

    const crumbs = await screen.findByRole('navigation', { name: 'Você está em' });
    expect(within(crumbs).getByRole('link', { name: 'Reservar' })).toHaveAttribute(
      'href',
      '/reservar',
    );
    expect(within(crumbs).getByText('Recurso 204')).toHaveAttribute('aria-current', 'page');
  });

  it('public pages have no app navigation', async () => {
    renderRoute('/login', { user: null });

    await screen.findByRole('heading', { level: 1, name: 'Entrar' });
    expect(screen.queryByRole('navigation', { name: 'Navegação principal' })).toBeNull();
  });
});
