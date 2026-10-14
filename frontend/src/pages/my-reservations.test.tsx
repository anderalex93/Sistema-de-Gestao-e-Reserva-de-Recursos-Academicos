import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { campusToUtcIso } from '@/domain/schedule';
import type { MyReservationRead, Page } from '@/lib/api/types';
import { buildResource, nextWeekday } from '@/test/catalog';
import { api, buildUser, renderRoute } from '@/test/render';
import { server } from '@/test/server';

const day = nextWeekday();

function mine(overrides: Partial<MyReservationRead> = {}): MyReservationRead {
  return {
    id: 10,
    codigo: 'EDU-7K3F9Q',
    status: 'CONFIRMADA',
    inicio: campusToUtcIso(day, '19:00'),
    fim: campusToUtcIso(day, '21:00'),
    finalidade: 'Estudo de cálculo',
    qtd_participantes: 3,
    recurso: buildResource(),
    usuario_id: 1,
    criado_em: '2026-10-13T12:00:00Z',
    cancelada_em: null,
    motivo_cancelamento: null,
    checkin_em: null,
    liberada_em: null,
    pode_cancelar: true,
    ...overrides,
  };
}

function page(items: MyReservationRead[]): Page<MyReservationRead> {
  return { items, total: items.length, page: 1, per_page: 10, total_pages: items.length ? 1 : 0 };
}

/** Responde por aba e registra os escopos pedidos. */
function serveMine(byScope: Record<string, MyReservationRead[]>): string[] {
  const scopes: string[] = [];
  server.use(
    http.get(api('/reservas/minhas'), ({ request }) => {
      const escopo = new URL(request.url).searchParams.get('escopo') ?? 'proximas';
      scopes.push(escopo);
      return HttpResponse.json(page(byScope[escopo] ?? []));
    }),
  );
  return scopes;
}

describe('my reservations', () => {
  it('lists upcoming reservations with status and actions', async () => {
    serveMine({ proximas: [mine()] });
    renderRoute('/minhas-reservas');

    const list = await screen.findByRole('list', { name: 'Próximas reservas' });
    expect(await within(list).findByText('Confirmada')).toBeInTheDocument();
    expect(within(list).getByText(/19:00 às 21:00/)).toBeInTheDocument();
    expect(within(list).getByRole('link', { name: 'Ver comprovante' })).toHaveAttribute(
      'href',
      '/comprovantes/EDU-7K3F9Q',
    );
    expect(within(list).getByRole('button', { name: 'Cancelar' })).toBeEnabled();
  });

  it('shows past and cancelled reservations in the history tab', async () => {
    const scopes = serveMine({
      historico: [
        mine({ id: 2, codigo: 'EDU-AAAAAA', status: 'CANCELADA', pode_cancelar: false }),
        mine({
          id: 3,
          codigo: 'EDU-BBBBBB',
          inicio: '2026-01-05T22:00:00Z',
          fim: '2026-01-05T23:00:00Z',
          pode_cancelar: false,
        }),
      ],
    });
    const { user, router } = renderRoute('/minhas-reservas');
    await screen.findByText('Você não tem reservas marcadas.');

    await user.click(screen.getByRole('tab', { name: 'Histórico' }));

    const list = await screen.findByRole('list', { name: 'Histórico de reservas' });
    expect(within(list).getByText('Cancelada')).toBeInTheDocument();
    expect(within(list).getByText('Concluída')).toBeInTheDocument();
    expect(within(list).queryByRole('button', { name: 'Cancelar' })).toBeNull();
    expect(router.state.location.search).toBe('?aba=historico');
    expect(scopes).toContain('historico');
  });

  it('shows the reason when the administration cancelled the reservation', async () => {
    serveMine({
      historico: [
        mine({
          status: 'CANCELADA',
          pode_cancelar: false,
          motivo_cancelamento: 'Manutenção do ar-condicionado',
        }),
      ],
    });
    renderRoute('/minhas-reservas?aba=historico');

    const list = await screen.findByRole('list', { name: 'Histórico de reservas' });
    expect(
      await within(list).findByText('Manutenção do ar-condicionado', { exact: false }),
    ).toHaveTextContent('Cancelada pela administração: Manutenção do ar-condicionado');
  });

  it('explains why a reservation can no longer be cancelled', async () => {
    serveMine({ proximas: [mine({ pode_cancelar: false })] });
    const { user } = renderRoute('/minhas-reservas');

    const button = await screen.findByRole('button', { name: 'Cancelar' });
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).toHaveAccessibleDescription('Cancelamentos só até 30 min antes do início');
    await user.hover(button);

    expect(
      await screen.findByRole('tooltip', { name: 'Cancelamentos só até 30 min antes do início' }),
    ).toBeInTheDocument();
  });

  it('offers to reserve when there is nothing upcoming', async () => {
    renderRoute('/minhas-reservas');

    expect(await screen.findByText('Você não tem reservas marcadas.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Reservar espaço' })).toHaveAttribute(
      'href',
      '/reservar',
    );
  });
});

describe('cancellation', () => {
  it('always asks first and keeping the reservation sends nothing', async () => {
    let posts = 0;
    serveMine({ proximas: [mine()] });
    server.use(
      http.post(api('/reservas/:id/cancelar'), () => {
        posts += 1;
        return HttpResponse.json(mine({ status: 'CANCELADA', pode_cancelar: false }));
      }),
    );
    const { user } = renderRoute('/minhas-reservas');

    await user.click(await screen.findByRole('button', { name: 'Cancelar' }));
    const dialog = await screen.findByRole('dialog', { name: 'Deseja cancelar esta reserva?' });
    expect(dialog).toHaveTextContent('EDU-7K3F9Q');
    await user.click(within(dialog).getByRole('button', { name: 'Manter reserva' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(posts).toBe(0);
  });

  it('cancels, confirms and refreshes the list', async () => {
    let cancelled = false;
    server.use(
      http.get(api('/reservas/minhas'), () => HttpResponse.json(page(cancelled ? [] : [mine()]))),
      http.post(api('/reservas/10/cancelar'), () => {
        cancelled = true;
        return HttpResponse.json(mine({ status: 'CANCELADA', pode_cancelar: false }));
      }),
    );
    const { user } = renderRoute('/minhas-reservas');

    await user.click(await screen.findByRole('button', { name: 'Cancelar' }));
    const dialog = await screen.findByRole('dialog', { name: 'Deseja cancelar esta reserva?' });
    await user.click(within(dialog).getByRole('button', { name: 'Sim, cancelar' }));

    expect(
      await screen.findByText('Reserva cancelada. O horário ficou livre de novo.'),
    ).toBeInTheDocument();
    expect(await screen.findByText('Você não tem reservas marcadas.')).toBeInTheDocument();
  });

  it('shows the server reason when the deadline passed meanwhile', async () => {
    serveMine({ proximas: [mine()] });
    server.use(
      http.post(api('/reservas/10/cancelar'), () =>
        HttpResponse.json(
          {
            detail: 'Cancelamentos só até 30 minutos antes do início da reserva.',
            code: 'PRAZO_CANCELAMENTO_EXPIRADO',
          },
          { status: 422 },
        ),
      ),
    );
    const { user } = renderRoute('/minhas-reservas');

    await user.click(await screen.findByRole('button', { name: 'Cancelar' }));
    const dialog = await screen.findByRole('dialog', { name: 'Deseja cancelar esta reserva?' });
    await user.click(within(dialog).getByRole('button', { name: 'Sim, cancelar' }));

    expect(await within(dialog).findByRole('alert')).toHaveTextContent('30 minutos antes');
  });
});

describe('dashboard', () => {
  it('greets the user and shows the next reservation', async () => {
    serveMine({ proximas: [mine()] });
    renderRoute('/', { user: buildUser({ nome: 'Lucas Andrade' }) });

    expect(await screen.findByText('Olá, Lucas')).toBeInTheDocument();
    const next = await screen.findByRole('region', { name: 'Sua próxima reserva' });
    expect(next).toHaveTextContent('Sala de estudo 204');
    expect(within(next).getByRole('link', { name: 'Ver comprovante' })).toHaveAttribute(
      'href',
      '/comprovantes/EDU-7K3F9Q',
    );
  });

  it('invites to reserve when there is nothing upcoming', async () => {
    renderRoute('/');

    expect(await screen.findByText('Você não tem reservas marcadas.')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Nova reserva' }).length).toBeGreaterThan(0);
  });
});

describe('check-in in my reservations (#43)', () => {
  it('tells when to read the door QR and shows confirmed and released reservations', async () => {
    serveMine({
      proximas: [mine()],
      historico: [
        mine({
          id: 11,
          codigo: 'EDU-AAAAAA',
          status: 'NAO_COMPARECEU',
          liberada_em: campusToUtcIso(day, '19:15'),
          pode_cancelar: false,
        }),
        mine({ id: 12, codigo: 'EDU-BBBBBB', checkin_em: campusToUtcIso(day, '18:55') }),
      ],
    });
    const { user } = renderRoute('/minhas-reservas');

    const upcoming = await screen.findByRole('list', { name: 'Próximas reservas' });
    expect(
      await within(upcoming).findByText('Check-in pelo QR da porta entre 18:45 e 19:15'),
    ).toBeVisible();

    await user.click(screen.getByRole('tab', { name: 'Histórico' }));
    const history = await screen.findByRole('list', { name: 'Histórico de reservas' });
    expect(await within(history).findByText('Não compareceu')).toBeVisible();
    expect(
      within(history).getByText('Liberada às 19:15: não houve check-in no prazo'),
    ).toBeVisible();
    expect(within(history).getByText('Presença confirmada às 18:55')).toBeVisible();
  });
});
