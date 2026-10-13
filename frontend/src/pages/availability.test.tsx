import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';

import { addDays } from '@/domain/schedule';
import {
  buildAvailability,
  buildResource,
  nextSunday,
  nextWeekday,
  serveCatalog,
} from '@/test/catalog';
import { api, renderRoute } from '@/test/render';
import { server } from '@/test/server';

const sala = buildResource();
const day = nextWeekday();

function serveDay(overrides: Parameters<typeof buildAvailability>[2]) {
  const requested: string[] = [];
  server.use(
    http.get(api('/recursos/:id/disponibilidade'), ({ request }) => {
      const data = new URL(request.url).searchParams.get('data') ?? '';
      requested.push(data);
      return HttpResponse.json(buildAvailability(sala.id, data, data === day ? overrides : {}));
    }),
  );
  return requested;
}

async function grid() {
  return screen.findByRole('list', { name: 'Horários do dia' });
}

beforeEach(() => serveCatalog([sala]));

describe('resource availability grid', () => {
  it('shows each state with text, not only color', async () => {
    serveDay({
      '08:00': { status: 'PASSADO' },
      '19:00': { status: 'OCUPADO' },
      '20:00': { status: 'OCUPADO', propria: true },
    });
    renderRoute(`/recursos/204?data=${day}`);

    const slots = await grid();
    expect(within(slots).getAllByRole('listitem')).toHaveLength(26);
    expect(within(slots).getByRole('button', { name: '08:00 às 08:30, encerrado' })).toBeDisabled();
    expect(within(slots).getByRole('button', { name: '19:00 às 19:30, ocupado' })).toBeDisabled();
    expect(
      within(slots).getByRole('button', { name: '20:00 às 20:30, sua reserva' }),
    ).toBeDisabled();
    expect(
      within(slots).getByRole('button', { name: '18:30 às 19:00, livre', pressed: false }),
    ).toBeEnabled();
  });

  it('selects a continuous interval with two clicks', async () => {
    serveDay({});
    const { user } = renderRoute(`/recursos/204?data=${day}`);
    const slots = await grid();

    await user.click(within(slots).getByRole('button', { name: /^19:00 às 19:30/ }));
    await user.click(within(slots).getByRole('button', { name: /^20:30 às 21:00/ }));

    expect(within(slots).getAllByRole('button', { pressed: true })).toHaveLength(4);
    expect(screen.getByText('19:00 às 21:00 · 2h')).toBeInTheDocument();
  });

  it('never selects across an occupied slot', async () => {
    serveDay({ '19:00': { status: 'OCUPADO' } });
    const { user } = renderRoute(`/recursos/204?data=${day}`);
    const slots = await grid();

    await user.click(within(slots).getByRole('button', { name: /^18:00 às 18:30/ }));
    await user.click(within(slots).getByRole('button', { name: /^20:00 às 20:30/ }));

    expect(within(slots).getAllByRole('button', { pressed: true })).toHaveLength(1);
    expect(screen.getByText('20:00 às 20:30 · 30 min')).toBeInTheDocument();
  });

  it('clicking the single selected slot again clears the selection', async () => {
    serveDay({});
    const { user } = renderRoute(`/recursos/204?data=${day}`);
    const slots = await grid();
    const slot = within(slots).getByRole('button', { name: /^10:00 às 10:30/ });

    await user.click(slot);
    await user.click(slot);

    expect(within(slots).queryAllByRole('button', { pressed: true })).toHaveLength(0);
    expect(screen.getByText('Escolha um horário livre na grade para ver o resumo.')).toBeVisible();
  });

  it('preselects the interval that came from the search', async () => {
    serveDay({});
    renderRoute(`/recursos/204?data=${day}&inicio=19:00&fim=20:00`);

    const slots = await grid();
    expect(within(slots).getAllByRole('button', { pressed: true })).toHaveLength(2);
    expect(screen.getByText('19:00 às 20:00 · 1h')).toBeInTheDocument();
  });

  it('moves between days through the URL', async () => {
    const requested = serveDay({});
    const { user, router } = renderRoute(`/recursos/204?data=${day}`);
    await grid();

    await user.click(screen.getByRole('button', { name: 'Próximo dia' }));

    const next = addDays(day, 1);
    await waitFor(() => expect(router.state.location.search).toBe(`?data=${next}`));
    await waitFor(() => expect(requested).toContain(next));
  });

  it('explains when the campus is closed', async () => {
    renderRoute(`/recursos/204?data=${nextSunday()}`);

    expect(
      await screen.findByText('O campus não abre neste dia. Escolha outra data.'),
    ).toBeInTheDocument();
  });

  it('does not go back before today', async () => {
    renderRoute('/recursos/204?data=2020-01-01');

    await grid().catch(() => null);
    expect(screen.getByRole('button', { name: 'Dia anterior' })).toBeDisabled();
  });
});
