import { screen, waitFor, within } from '@testing-library/react';
import { delay, http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';

import { campusToUtcIso } from '@/domain/schedule';
import type { ReservationRead } from '@/lib/api/types';
import { buildAvailability, buildResource, nextWeekday, serveCatalog } from '@/test/catalog';
import { api, renderRoute } from '@/test/render';
import { server } from '@/test/server';

const sala = buildResource();
const day = nextWeekday();

function reservation(overrides: Partial<ReservationRead> = {}): ReservationRead {
  return {
    id: 10,
    codigo: 'EDU-7K3F9Q',
    status: 'CONFIRMADA',
    inicio: campusToUtcIso(day, '19:00'),
    fim: campusToUtcIso(day, '20:00'),
    finalidade: null,
    qtd_participantes: null,
    recurso: sala,
    usuario_id: 1,
    criado_em: '2026-10-13T12:00:00Z',
    cancelada_em: null,
    motivo_cancelamento: null,
    checkin_em: null,
    liberada_em: null,
    ...overrides,
  };
}

/** Abre o recurso, escolhe 19:00 às 20:00 e abre o resumo. */
async function openSummary() {
  const view = renderRoute(`/recursos/204?data=${day}`);
  const slots = await screen.findByRole('list', { name: 'Horários do dia' });
  await view.user.click(within(slots).getByRole('button', { name: /^19:00 às 19:30/ }));
  await view.user.click(within(slots).getByRole('button', { name: /^19:30 às 20:00/ }));
  await view.user.click(screen.getByRole('button', { name: 'Reservar este horário' }));
  const dialog = await screen.findByRole('dialog', { name: 'Confirmar reserva?' });
  // A ação segura recebe o foco quando o diálogo termina de abrir.
  await waitFor(() => expect(within(dialog).getByRole('button', { name: 'Voltar' })).toHaveFocus());
  return { ...view, dialog };
}

beforeEach(() => serveCatalog([sala]));

describe('reservation summary dialog', () => {
  it('shows the summary and confirms with one click', async () => {
    let sent: unknown = null;
    server.use(
      http.post(api('/reservas'), async ({ request }) => {
        sent = await request.json();
        return HttpResponse.json(reservation(), { status: 201 });
      }),
    );
    const { user, router, dialog } = await openSummary();

    const text = dialog.textContent ?? '';
    for (const expected of ['Sala de estudo 204', 'Bloco A · 1º andar', '19:00 às 20:00', '1h']) {
      expect(text).toContain(expected);
    }
    await user.type(
      within(dialog).getByRole('textbox', { name: /Finalidade/ }),
      'Estudo de cálculo',
    );
    await user.type(within(dialog).getByRole('textbox', { name: /Participantes/ }), '4');
    await user.click(within(dialog).getByRole('button', { name: 'Confirmar reserva' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/comprovantes/EDU-7K3F9Q'));
    expect(sent).toEqual({
      recurso_id: 204,
      inicio: campusToUtcIso(day, '19:00'),
      fim: campusToUtcIso(day, '20:00'),
      finalidade: 'Estudo de cálculo',
      qtd_participantes: 4,
    });
    expect(await screen.findByText('Reserva confirmada.')).toBeInTheDocument();
  });

  it('checks the participants against the capacity before sending', async () => {
    let posted = false;
    server.use(
      http.post(api('/reservas'), () => {
        posted = true;
        return HttpResponse.json(reservation(), { status: 201 });
      }),
    );
    const { user, dialog } = await openSummary();

    await user.type(within(dialog).getByRole('textbox', { name: /Participantes/ }), '7');
    await user.click(within(dialog).getByRole('button', { name: 'Confirmar reserva' }));

    expect(await within(dialog).findByText('Este espaço comporta até 6 pessoas.')).toBeVisible();
    expect(posted).toBe(false);
  });

  it('blocks a second click while confirming', async () => {
    let posts = 0;
    server.use(
      http.post(api('/reservas'), async () => {
        posts += 1;
        await delay('infinite');
        return HttpResponse.json(reservation(), { status: 201 });
      }),
    );
    const { user, dialog } = await openSummary();

    await user.dblClick(within(dialog).getByRole('button', { name: 'Confirmar reserva' }));
    const busy = await within(dialog).findByRole('button', { name: 'Confirmando…' });

    expect(busy).toBeDisabled();
    expect(posts).toBe(1);
  });

  it('on conflict, warns, refreshes the grid and keeps the user on the page', async () => {
    let taken = false;
    const loads: string[] = [];
    server.use(
      http.post(api('/reservas'), () => {
        taken = true;
        return HttpResponse.json(
          {
            detail:
              'Este horário acabou de ser reservado por outra pessoa. Escolha outro horário na grade.',
            code: 'RESERVA_CONFLITO',
          },
          { status: 409 },
        );
      }),
      http.get(api('/recursos/:id/disponibilidade'), ({ request }) => {
        const data = new URL(request.url).searchParams.get('data') ?? day;
        loads.push(data);
        const busy = { status: 'OCUPADO' as const };
        return HttpResponse.json(
          buildAvailability(sala.id, data, taken ? { '19:00': busy, '19:30': busy } : {}),
        );
      }),
    );
    const { user, router, dialog } = await openSummary();

    await user.click(within(dialog).getByRole('button', { name: 'Confirmar reserva' }));

    expect(await screen.findByText(/acabou de ser reservado por outra pessoa/)).toBeVisible();
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(router.state.location.pathname).toBe('/recursos/204');
    expect(await screen.findByRole('button', { name: '19:00 às 19:30, ocupado' })).toBeDisabled();
    expect(screen.queryAllByRole('button', { pressed: true })).toHaveLength(0);
    expect(loads.length).toBeGreaterThan(1);
  });

  it('closes without reserving', async () => {
    const { user, dialog } = await openSummary();

    await user.click(within(dialog).getByRole('button', { name: 'Voltar' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(screen.getAllByRole('button', { pressed: true })).toHaveLength(2);
  });
});
