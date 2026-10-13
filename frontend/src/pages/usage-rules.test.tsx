import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';

import { addDays, campusToday } from '@/domain/schedule';
import { buildResource, nextWeekday, serveCatalog } from '@/test/catalog';
import { api, renderRoute } from '@/test/render';
import { server } from '@/test/server';

const sala = buildResource();

beforeEach(() => serveCatalog([sala]));

describe('usage rules (#28) in the interface', () => {
  it('does not let the selection go past the maximum duration', async () => {
    const { user } = renderRoute(`/recursos/204?data=${nextWeekday()}`);
    const slots = await screen.findByRole('list', { name: 'Horários do dia' });

    await user.click(within(slots).getByRole('button', { name: /^08:00 às 08:30/ }));
    await user.click(within(slots).getByRole('button', { name: /^12:00 às 12:30/ }));

    expect(screen.getByText('Cada reserva pode ter no máximo 4h.')).toBeInTheDocument();
    expect(within(slots).getAllByRole('button', { pressed: true })).toHaveLength(1);

    await user.click(within(slots).getByRole('button', { name: /^11:30 às 12:00/ }));
    expect(within(slots).getAllByRole('button', { pressed: true })).toHaveLength(8);
    expect(screen.queryByText('Cada reserva pode ter no máximo 4h.')).toBeNull();
  });

  it('stops at the last bookable day', async () => {
    const last = addDays(campusToday(), 14);
    const { router } = renderRoute(`/recursos/204?data=${addDays(last, 5)}`);

    await waitFor(() => expect(screen.getByRole('button', { name: 'Próximo dia' })).toBeDisabled());
    expect(screen.getByLabelText('Data')).toHaveValue(last);
    expect(router.state.location.search).toContain(addDays(last, 5));
  });

  it('explains the active reservations limit instead of offering to reserve', async () => {
    server.use(
      http.get(api('/reservas/minhas'), () =>
        HttpResponse.json({ items: [], total: 3, page: 1, per_page: 1, total_pages: 3 }),
      ),
    );
    const { user } = renderRoute(`/recursos/204?data=${nextWeekday()}`);
    const slots = await screen.findByRole('list', { name: 'Horários do dia' });

    await user.click(within(slots).getByRole('button', { name: /^10:00 às 10:30/ }));

    expect(
      await screen.findByText(/Você já tem 3 reservas ativas, o limite do seu perfil/),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reservar este horário' })).toBeNull();
    expect(screen.getByRole('link', { name: 'Ver minhas reservas' })).toHaveAttribute(
      'href',
      '/minhas-reservas',
    );
  });
});
