import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';

import { buildResource, nextWeekday, resourcePage, serveCatalog } from '@/test/catalog';
import { api, renderRoute } from '@/test/render';
import { server } from '@/test/server';

const sala = buildResource();

/** Guarda a query string de cada busca feita à API. */
function captureSearches(respond = () => resourcePage([sala])): URLSearchParams[] {
  const searches: URLSearchParams[] = [];
  server.use(
    http.get(api('/recursos'), ({ request }) => {
      searches.push(new URL(request.url).searchParams);
      return HttpResponse.json(respond());
    }),
  );
  return searches;
}

beforeEach(() => serveCatalog([sala]));

describe('resource search filters', () => {
  it('applies the filters from the URL, converting the time window to UTC', async () => {
    const searches = captureSearches();
    const day = nextWeekday();
    renderRoute(`/reservar?bloco_id=1&caracteristicas=1&data=${day}&inicio=19:00&fim=21:00`);

    await screen.findByRole('link', { name: /Sala de estudo 204/ });
    const last = searches.at(-1);
    expect(last?.get('bloco_id')).toBe('1');
    expect(last?.getAll('caracteristicas')).toEqual(['1']);
    expect(last?.get('inicio')).toBe(`${day}T22:00:00.000Z`);
    expect(screen.getByText(/1 recurso livre em .*, 19:00 às 21:00/)).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Bloco' })).toHaveTextContent('Bloco A');
    expect(screen.getByRole('button', { name: 'Projetor', pressed: true })).toBeInTheDocument();
  });

  it('writes each change to the URL and searches again from page 1', async () => {
    const searches = captureSearches();
    const { user, router } = renderRoute('/reservar?page=2');
    await screen.findByRole('link', { name: /Sala de estudo 204/ });

    await user.click(screen.getByRole('combobox', { name: 'Tipo' }));
    await user.click(await screen.findByRole('option', { name: 'Laboratório' }));
    await user.click(screen.getByRole('button', { name: 'Ar-condicionado', pressed: false }));

    await waitFor(() =>
      expect(router.state.location.search).toBe('?tipo=LABORATORIO&caracteristicas=2'),
    );
    expect(searches.at(-1)?.toString()).toBe(
      'page=1&per_page=24&tipo=LABORATORIO&caracteristicas=2',
    );
  });

  it('searches by name after the user stops typing', async () => {
    const searches = captureSearches();
    const { user, router } = renderRoute('/reservar');
    await screen.findByRole('link', { name: /Sala de estudo 204/ });

    await user.type(screen.getByRole('textbox', { name: 'Nome' }), 'redes');

    await waitFor(() => expect(router.state.location.search).toBe('?busca=redes'));
    await waitFor(() => expect(searches.at(-1)?.get('busca')).toBe('redes'));
    expect(searches.some((params) => params.get('busca') === 'r')).toBe(false);
  });

  it('drops an end time that would come before the new start', async () => {
    const day = nextWeekday();
    const { user, router } = renderRoute(`/reservar?data=${day}&inicio=08:00&fim=09:00`);
    await screen.findByRole('link', { name: /Sala de estudo 204/ });

    await user.click(screen.getByRole('combobox', { name: 'Início' }));
    await user.click(await screen.findByRole('option', { name: '10:00' }));

    await waitFor(() => expect(router.state.location.search).toBe(`?data=${day}&inicio=10%3A00`));
  });

  it('clears every filter at once', async () => {
    const searches = captureSearches(() => resourcePage([]));
    const { user, router } = renderRoute('/reservar?tipo=AUDITORIO&busca=central');

    expect(await screen.findByText('Nenhum recurso atende a esses filtros.')).toBeInTheDocument();
    const [first] = screen.getAllByRole('button', { name: 'Limpar filtros' });
    if (!first) throw new Error('botão Limpar filtros ausente');
    await user.click(first);

    await waitFor(() => expect(router.state.location.search).toBe(''));
    await waitFor(() => expect(searches.at(-1)?.toString()).toBe('page=1&per_page=24'));
    expect(screen.getByRole('textbox', { name: 'Nome' })).toHaveValue('');
    expect(screen.queryByRole('button', { name: 'Limpar filtros' })).toBeNull();
  });

  it('keeps the filters when coming back from a resource', async () => {
    const { user, router } = renderRoute('/reservar?tipo=SALA_ESTUDO');

    await user.click(await screen.findByRole('link', { name: /Sala de estudo 204/ }));
    await screen.findByRole('heading', { level: 1, name: 'Sala de estudo 204' });
    await router.navigate(-1);

    const list = await screen.findByRole('list', { name: 'Recursos' });
    expect(within(list).getByRole('link', { name: /Sala de estudo 204/ })).toBeInTheDocument();
    expect(router.state.location.search).toBe('?tipo=SALA_ESTUDO');
    expect(screen.getByRole('combobox', { name: 'Tipo' })).toHaveTextContent('Sala de estudo');
  });
});
