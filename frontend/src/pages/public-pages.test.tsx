import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { helpFaq, institution, mainFaq, team } from '@/content/public-content';
import { fullTitle, SEO_PAGES } from '@/seo/public-seo';
import { renderRoute } from '@/test/render';

describe('landing page', () => {
  it('says what the system does and offers the institutional login above everything else', async () => {
    renderRoute('/', { user: null });

    expect(
      await screen.findByRole('heading', { level: 1, name: /Reserve salas, laboratórios/ }),
    ).toBeVisible();
    const ctas = screen.getAllByRole('link', { name: 'Entrar com e-mail institucional' });
    expect(ctas.length).toBeGreaterThan(0);
    for (const cta of ctas) expect(cta).toHaveAttribute('href', '/login');
    expect(screen.getByRole('link', { name: 'Criar conta' })).toHaveAttribute('href', '/cadastro');
    expect(document.title).toBe('Reserva de salas e equipamentos da UMJ · EduSpace');
  });

  it('shows real captures with description, reserved size and lazy loading below the fold', async () => {
    renderRoute('/', { user: null });

    const grid = await screen.findByRole('img', {
      name: /Grade de horários da Sala de estudo 204/,
    });
    const receipt = screen.getByRole('img', { name: /Comprovante de reserva no celular/ });
    for (const image of [grid, receipt]) {
      expect(image).toHaveAttribute('width');
      expect(image).toHaveAttribute('height');
    }
    expect(grid).toHaveAttribute('loading', 'eager');
    expect(receipt).toHaveAttribute('loading', 'lazy');
  });

  it('explains the journey in four numbered steps and answers five questions', async () => {
    renderRoute('/', { user: null });

    const steps = within(await screen.findByRole('region', { name: 'Como funciona' })).getAllByRole(
      'listitem',
    );
    expect(steps).toHaveLength(4);
    const faq = screen.getByRole('region', { name: 'Perguntas frequentes' });
    for (const item of mainFaq) expect(within(faq).getByText(item.pergunta)).toBeInTheDocument();
    expect(within(faq).getByRole('link', { name: /Ajuda/ })).toHaveAttribute('href', '/ajuda');
  });

  it('sends a signed-in person straight to the dashboard', async () => {
    const { router } = renderRoute('/');

    expect(await screen.findByRole('heading', { level: 1, name: 'Início' })).toBeVisible();
    expect(router.state.location.pathname).toBe('/inicio');
  });
});

describe('public footer and header', () => {
  it('links every public page and the campus address with directions', async () => {
    renderRoute('/sobre', { user: null });

    const footer = await screen.findByRole('navigation', { name: 'Rodapé' });
    const links = within(footer).getAllByRole('link');
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/sobre',
      '/ajuda',
      '/termos',
      '/privacidade',
    ]);
    const directions = screen.getByRole('link', { name: /Como chegar/ });
    expect(directions).toHaveAttribute('href', institution.mapsUrl);
    expect(directions).toHaveAttribute('target', '_blank');
    expect(screen.getByText(new RegExp(institution.nome))).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Entrar' })).toHaveAttribute('href', '/login');
  });

  it('offers the way back to the app to who is signed in', async () => {
    renderRoute('/ajuda');

    expect(await screen.findByRole('link', { name: 'Ir para o início' })).toHaveAttribute(
      'href',
      '/inicio',
    );
  });
});

describe('about page', () => {
  it('presents the project, the team and the course, without a stock photo', async () => {
    renderRoute('/sobre', { user: null });

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Sobre o EduSpace' }),
    ).toBeVisible();
    for (const member of team) {
      expect(screen.getByText(member.nome)).toBeInTheDocument();
      expect(screen.getByText(member.papel)).toBeInTheDocument();
    }
    expect(screen.getByText(/Projeto Integrador I do/)).toBeInTheDocument();
    expect(screen.queryByRole('img')).toBeNull();
  });
});

describe('help page', () => {
  it('lists every question open and points to the campus administration without a support e-mail', async () => {
    renderRoute('/ajuda', { user: null });

    expect(await screen.findByRole('heading', { level: 1, name: 'Ajuda' })).toBeVisible();
    for (const item of helpFaq) expect(screen.getByText(item.resposta)).toBeVisible();
    const support = screen.getByRole('region', { name: 'Fale com o suporte' });
    await waitFor(() =>
      expect(within(support).getByText(/Procure a administração do campus/)).toBeVisible(),
    );
  });
});

describe('search engine tags (#48)', () => {
  it.each(SEO_PAGES.map((item) => [item.path, item] as const))(
    '%s has the title and the description of the SEO table',
    async (path, item) => {
      renderRoute(path, { user: null });

      await waitFor(() => expect(document.title).toBe(fullTitle(item.title)));
      expect(document.head.querySelector('meta[name="description"]')).toHaveAttribute(
        'content',
        item.description,
      );
      expect(document.head.querySelector('meta[name="robots"]')).toBeNull();
    },
  );

  it('keeps the logged area out of search engines', async () => {
    renderRoute('/inicio');

    await screen.findByRole('heading', { level: 1, name: 'Início' });
    expect(document.head.querySelector('meta[name="robots"]')).toHaveAttribute(
      'content',
      'noindex',
    );
  });

  it('keeps receipts out of search engines', async () => {
    renderRoute('/comprovantes/EDU-7K3F9Q', { user: null });

    await waitFor(() =>
      expect(document.head.querySelector('meta[name="robots"]')).toHaveAttribute(
        'content',
        'noindex',
      ),
    );
  });
});
