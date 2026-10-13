import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';

import { addDays, campusToUtcIso } from '@/domain/schedule';
import type { BoardRead } from '@/lib/api/types';
import { buildResource, nextSunday, nextWeekday, serveCatalog } from '@/test/catalog';
import { api, renderRoute } from '@/test/render';
import { server } from '@/test/server';

const day = nextWeekday();
const sala = buildResource();
const lab = buildResource({
  id: 30,
  nome: 'Laboratório 1',
  tipo: 'LABORATORIO',
  capacidade: 30,
  bloco: { id: 3, nome: 'Bloco C', descricao: null },
});

function serveBoard(): URLSearchParams[] {
  const requests: URLSearchParams[] = [];
  server.use(
    http.get(api('/quadro'), ({ request }) => {
      const params = new URL(request.url).searchParams;
      requests.push(params);
      const data = params.get('data') ?? day;
      const closed = data === nextSunday();
      const body: BoardRead = {
        data,
        abertura: closed ? null : '08:00:00',
        fechamento: closed ? null : '21:00:00',
        linhas: closed
          ? []
          : [
              {
                recurso: sala,
                ocupacoes: [
                  {
                    inicio: campusToUtcIso(data, '19:00'),
                    fim: campusToUtcIso(data, '20:00'),
                    propria: false,
                    reservado_por: null,
                  },
                ],
              },
              {
                recurso: lab,
                ocupacoes: [
                  {
                    inicio: campusToUtcIso(data, '08:00'),
                    fim: campusToUtcIso(data, '10:00'),
                    propria: true,
                    reservado_por: null,
                  },
                ],
              },
            ],
      };
      return HttpResponse.json(body);
    }),
  );
  return requests;
}

beforeEach(() => serveCatalog([sala, lab]));

describe('board page', () => {
  it('shows what is taken in every resource, with text and not only color', async () => {
    serveBoard();
    renderRoute(`/quadro?data=${day}`);

    const table = await screen.findByRole('table', { name: 'Quadro de horários' });
    const salaRow = within(table).getByRole('row', { name: /Sala de estudo 204/ });
    expect(within(salaRow).getByText('19:00 às 20:00, ocupado')).toBeInTheDocument();
    const labRow = within(table).getByRole('row', { name: /Laboratório 1/ });
    expect(within(labRow).getByText('08:00 às 10:00, sua reserva')).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Legenda' })).toHaveTextContent(
      'LivreOcupadoSua reservaEncerrado',
    );
  });

  it('links free time to the resource grid with the slot preselected', async () => {
    serveBoard();
    renderRoute(`/quadro?data=${day}`);

    const table = await screen.findByRole('table', { name: 'Quadro de horários' });
    const free = within(table).getByRole('link', {
      name: 'Sala de estudo 204: 20:00 às 21:00, livre',
    });

    expect(free).toHaveAttribute('href', `/recursos/204?data=${day}&inicio=20%3A00&fim=20%3A30`);
    expect(within(table).getByRole('link', { name: 'Laboratório 1' })).toHaveAttribute(
      'href',
      `/recursos/30?data=${day}`,
    );
  });

  it('keeps day and filters in the URL', async () => {
    const requests = serveBoard();
    const { user, router } = renderRoute(`/quadro?data=${day}`);
    await screen.findByRole('table', { name: 'Quadro de horários' });

    await user.click(screen.getByRole('combobox', { name: 'Tipo' }));
    await user.click(await screen.findByRole('option', { name: 'Laboratório' }));
    await user.click(screen.getByRole('button', { name: 'Próximo dia' }));

    const next = addDays(day, 1);
    await waitFor(() =>
      expect(router.state.location.search).toBe(`?data=${next}&tipo=LABORATORIO`),
    );
    await waitFor(() => expect(requests.at(-1)?.toString()).toBe(`data=${next}&tipo=LABORATORIO`));
  });

  it('explains when the campus is closed', async () => {
    serveBoard();
    renderRoute(`/quadro?data=${nextSunday()}`);

    expect(
      await screen.findByText('O campus não abre neste dia. Escolha outra data.'),
    ).toBeInTheDocument();
  });

  it('is reachable from the reserve page', async () => {
    renderRoute('/reservar');

    // O link da própria página, não o da navegação lateral (que o jsdom só esconde via CSS).
    const main = await screen.findByRole('main');
    expect(await within(main).findByRole('link', { name: 'Quadro de horários' })).toHaveAttribute(
      'href',
      '/quadro',
    );
  });
});
