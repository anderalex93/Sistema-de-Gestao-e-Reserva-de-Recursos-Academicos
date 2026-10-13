import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { adminUser, renderRoute } from '@/test/render';

describe('AppLayout', () => {
  it('offers the desktop side navigation with the current page marked', async () => {
    renderRoute('/minhas-reservas', { user: adminUser });
    await screen.findByRole('heading', { level: 1, name: 'Minhas reservas' });

    const nav = screen.getByRole('navigation', { name: 'Navegação principal' });
    const links = within(nav).getAllByRole('link');
    expect(links.map((link) => link.textContent)).toEqual([
      'Início',
      'Reservar',
      'Quadro de horários',
      'Minhas reservas',
      'Administração',
    ]);
    expect(within(nav).getByRole('link', { name: 'Minhas reservas' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(within(nav).getByRole('link', { name: 'Início' })).not.toHaveAttribute('aria-current');
  });

  it('offers the four mobile destinations', async () => {
    renderRoute('/');
    await screen.findByRole('heading', { level: 1, name: 'Início' });

    const nav = screen.getByRole('navigation', { name: 'Navegação inferior' });
    expect(
      within(nav)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['Início', 'Reservar', 'Reservas', 'Conta']);
  });

  it('navigates between pages through the menu', async () => {
    const { user } = renderRoute('/');
    await screen.findByRole('heading', { level: 1, name: 'Início' });

    const nav = screen.getByRole('navigation', { name: 'Navegação principal' });
    await user.click(within(nav).getByRole('link', { name: 'Reservar' }));

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Reservar espaço' }),
    ).toBeInTheDocument();
  });

  it('has a skip link to the main content and a way to sign out', async () => {
    renderRoute('/');
    await screen.findByRole('heading', { level: 1, name: 'Início' });

    expect(screen.getByRole('link', { name: 'Pular para o conteúdo' })).toHaveAttribute(
      'href',
      '#conteudo',
    );
    expect(screen.getByRole('main')).toHaveAttribute('id', 'conteudo');
    expect(screen.getByRole('button', { name: 'Sair' })).toBeInTheDocument();
  });
});
