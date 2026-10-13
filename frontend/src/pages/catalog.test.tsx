import { screen, within } from '@testing-library/react';
import { delay, http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';

import { buildResource, resourcePage, serveCatalog } from '@/test/catalog';
import { api, renderRoute } from '@/test/render';
import { server } from '@/test/server';

const sala = buildResource();
const projetor = buildResource({
  id: 7,
  nome: 'Projetor Epson 01',
  tipo: 'EQUIPAMENTO',
  capacidade: null,
  andar: null,
  descricao: 'Retirada no apoio audiovisual.',
  bloco: { id: 4, nome: 'Bloco D', descricao: null },
  caracteristicas: [{ id: 1, nome: 'Projetor' }],
});

// Blocos e características sempre respondem; cada teste ajusta a lista quando precisa.
beforeEach(() => serveCatalog([]));

describe('reserve page (catalog list)', () => {
  it('shows each resource with type, location, capacity and features', async () => {
    serveCatalog([sala, projetor]);
    renderRoute('/reservar');

    const list = await screen.findByRole('list', { name: 'Recursos' });
    const salaLink = await within(list).findByRole('link', { name: /Sala de estudo 204/ });
    expect(salaLink).toHaveAttribute('href', '/recursos/204');
    expect(within(salaLink).getByText('Sala de estudo')).toBeInTheDocument();
    expect(within(salaLink).getByText('Bloco A · 1º andar · Até 6 pessoas')).toBeInTheDocument();
    const features = within(salaLink).getByRole('list', {
      name: 'Características de Sala de estudo 204',
    });
    expect(
      within(features)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(['Ar-condicionado', 'Projetor']);

    const projetorLink = within(list).getByRole('link', { name: /Projetor Epson 01/ });
    expect(within(projetorLink).getByText('Equipamento')).toBeInTheDocument();
    expect(within(projetorLink).getByText('Bloco D')).toBeInTheDocument();
    expect(screen.getByText('2 recursos')).toBeInTheDocument();
  });

  it('opens the detail when a card is clicked', async () => {
    serveCatalog([sala, projetor]);
    const { user, router } = renderRoute('/reservar');

    await user.click(await screen.findByRole('link', { name: /Projetor Epson 01/ }));

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Projetor Epson 01' }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/recursos/7');
    expect(screen.getByText('Retirada no apoio audiovisual.')).toBeInTheDocument();
    expect(screen.queryByText('Capacidade')).toBeNull();
  });

  it('shows skeletons while loading', async () => {
    server.use(
      http.get(api('/recursos'), async () => {
        await delay('infinite');
        return HttpResponse.json(resourcePage([]));
      }),
    );
    renderRoute('/reservar');

    const list = await screen.findByRole('list', { name: 'Recursos' });
    expect(list).toHaveAttribute('aria-busy', 'true');
  });

  it('explains when nothing can be reserved', async () => {
    serveCatalog([]);
    renderRoute('/reservar');

    expect(
      await screen.findByText(/Nenhum espaço ou equipamento está disponível/),
    ).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Recursos' })).toBeNull();
  });

  it('offers a retry when the list fails to load', async () => {
    let calls = 0;
    server.use(
      http.get(api('/recursos'), () => {
        calls += 1;
        return calls === 1
          ? HttpResponse.json({ detail: 'erro' }, { status: 500 })
          : HttpResponse.json(resourcePage([sala]));
      }),
    );
    const { user } = renderRoute('/reservar');

    const alert = await screen.findByRole('alert');
    await user.click(within(alert).getByRole('button', { name: 'Tentar de novo' }));

    expect(await screen.findByRole('link', { name: /Sala de estudo 204/ })).toBeInTheDocument();
  });

  it('paginates long lists', async () => {
    const requested: (string | null)[] = [];
    server.use(
      http.get(api('/recursos'), ({ request }) => {
        const page = Number(new URL(request.url).searchParams.get('page'));
        requested.push(String(page));
        const item = page === 1 ? sala : projetor;
        return HttpResponse.json(resourcePage([item], { page, perPage: 24, total: 30 }));
      }),
    );
    const { user } = renderRoute('/reservar');
    await screen.findByRole('link', { name: /Sala de estudo 204/ });

    await user.click(screen.getByRole('button', { name: 'Página 2' }));

    expect(await screen.findByRole('link', { name: /Projetor Epson 01/ })).toBeInTheDocument();
    expect(requested).toEqual(['1', '2']);
  });
});

describe('resource page (detail)', () => {
  it('shows the details of a space', async () => {
    serveCatalog([sala]);
    renderRoute('/recursos/204');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Sala de estudo 204' }),
    ).toBeInTheDocument();
    const details = document.querySelector('main dl');
    expect(details).not.toBeNull();
    const text = details?.textContent ?? '';
    for (const expected of ['Bloco A', 'Entrada principal', '1º andar', 'Até 6 pessoas']) {
      expect(text).toContain(expected);
    }
    const crumbs = screen.getByRole('navigation', { name: 'Você está em' });
    expect(within(crumbs).getByText('Bloco A')).toBeInTheDocument();
  });

  it.each(['999', 'abc'])('shows a not found state for /recursos/%s', async (id) => {
    serveCatalog([sala]);
    renderRoute(`/recursos/${id}`);

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Recurso não encontrado' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver todos os recursos' })).toHaveAttribute(
      'href',
      '/reservar',
    );
  });
});
