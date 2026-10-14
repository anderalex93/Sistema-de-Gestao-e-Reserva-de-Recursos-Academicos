import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { campusToUtcIso, campusToday } from '@/domain/schedule';
import type { AdminReservationRead, BuildingAdminRead, Page } from '@/lib/api/types';
import { buildResource, nextWeekday } from '@/test/catalog';
import { adminUser, api, renderRoute } from '@/test/render';
import { server } from '@/test/server';

const day = nextWeekday();
const sala101 = buildResource({ id: 101, nome: 'Sala 101' });
const lab = buildResource({ id: 300, nome: 'Laboratório 3', tipo: 'LABORATORIO' });

function booking(overrides: Partial<AdminReservationRead> = {}): AdminReservationRead {
  return {
    id: 1,
    codigo: 'EDU-AAAA01',
    status: 'CONFIRMADA',
    inicio: campusToUtcIso(day, '08:00'),
    fim: campusToUtcIso(day, '09:00'),
    finalidade: null,
    qtd_participantes: null,
    recurso: sala101,
    usuario_id: 7,
    usuario: { id: 7, nome: 'Lucas Andrade', email: 'lucas@umj.edu.br' },
    criado_em: '2026-10-13T12:00:00Z',
    cancelada_em: null,
    motivo_cancelamento: null,
    checkin_em: null,
    liberada_em: null,
    encerrada_em: null,
    fim_previsto: null,
    ...overrides,
  };
}

const buildings: BuildingAdminRead[] = [
  { id: 1, nome: 'Bloco A', descricao: null, ativo: true, total_recursos: 2 },
];

function page(items: AdminReservationRead[]): Page<AdminReservationRead> {
  return { items, total: items.length, page: 1, per_page: 100, total_pages: items.length ? 1 : 0 };
}

const lucas = booking();
const ana = booking({
  id: 2,
  codigo: 'EDU-AAAA02',
  inicio: campusToUtcIso(day, '10:00'),
  fim: campusToUtcIso(day, '11:00'),
  usuario_id: 8,
  usuario: { id: 8, nome: 'Ana Lima', email: 'ana@umj.edu.br' },
  finalidade: 'Grupo de estudos',
});
const labBooking = booking({
  id: 3,
  codigo: 'EDU-AAAA03',
  recurso: lab,
  status: 'CANCELADA',
  cancelada_em: '2026-10-13T12:00:00Z',
  motivo_cancelamento: 'Manutenção elétrica',
});

function serveAgenda(items: () => AdminReservationRead[], seen: URLSearchParams[] = []) {
  server.use(
    http.get(api('/admin/reservas'), ({ request }) => {
      seen.push(new URL(request.url).searchParams);
      return HttpResponse.json(page(items()));
    }),
    http.get(api('/admin/blocos'), () => HttpResponse.json(buildings)),
  );
}

describe('admin agenda', () => {
  it('groups the day reservations by resource with who booked', async () => {
    const seen: URLSearchParams[] = [];
    serveAgenda(() => [lucas, ana, labBooking], seen);
    renderRoute(`/admin/agenda?data=${day}`, { user: adminUser });

    const sala = await screen.findByRole('list', { name: 'Reservas de Sala 101' });
    expect(within(sala).getAllByRole('listitem')).toHaveLength(2);
    expect(within(sala).getByText('Lucas Andrade')).toBeInTheDocument();
    expect(within(sala).getByText(/ana@umj\.edu\.br/)).toBeInTheDocument();
    expect(within(sala).getByText('Grupo de estudos')).toBeInTheDocument();
    const labList = screen.getByRole('list', { name: 'Reservas de Laboratório 3' });
    expect(within(labList).getByText('Manutenção elétrica')).toBeInTheDocument();
    expect(within(labList).queryByRole('button', { name: /Cancelar/ })).toBeNull();
    expect(screen.getByText(/3 reservas/)).toBeInTheDocument();
    expect(seen[0]?.get('data')).toBe(day);
  });

  it('defaults to today and filters by building and status', async () => {
    const seen: URLSearchParams[] = [];
    serveAgenda(() => [lucas], seen);
    const { user } = renderRoute('/admin/agenda', { user: adminUser });
    await screen.findByText('Lucas Andrade');
    expect(seen[0]?.get('data')).toBe(campusToday());

    await user.click(screen.getByRole('combobox', { name: 'Bloco' }));
    await user.click(await screen.findByRole('option', { name: 'Bloco A' }));
    await user.click(screen.getByRole('combobox', { name: 'Situação' }));
    await user.click(await screen.findByRole('option', { name: 'Canceladas' }));

    await waitFor(() =>
      expect(
        seen.some(
          (params) => params.get('bloco_id') === '1' && params.get('status') === 'CANCELADA',
        ),
      ).toBe(true),
    );
  });

  it('cancels with a mandatory reason and refreshes the agenda', async () => {
    let sent: unknown = null;
    serveAgenda(() =>
      sent
        ? [{ ...lucas, status: 'CANCELADA', motivo_cancelamento: 'Evento institucional' }]
        : [lucas],
    );
    server.use(
      http.post(api('/admin/reservas/1/cancelar'), async ({ request }) => {
        sent = await request.json();
        return HttpResponse.json({ ...lucas, status: 'CANCELADA' });
      }),
    );
    const { user } = renderRoute(`/admin/agenda?data=${day}`, { user: adminUser });

    await user.click(
      await screen.findByRole('button', { name: 'Cancelar reserva de Lucas Andrade às 08:00' }),
    );
    const dialog = await screen.findByRole('dialog', {
      name: 'Cancelar a reserva de Lucas Andrade?',
    });
    expect(dialog).toHaveTextContent('sem dados pessoais');
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar reserva' }));
    expect(
      await within(dialog).findByText('Explique o motivo em pelo menos 5 caracteres.'),
    ).toBeInTheDocument();
    expect(sent).toBeNull();

    await user.type(within(dialog).getByLabelText(/^Motivo/), 'Evento institucional');
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar reserva' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(sent).toEqual({ motivo: 'Evento institucional' });
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Reserva de Lucas Andrade cancelada. O horário ficou livre.',
    );
    expect(await screen.findByText('Evento institucional')).toBeInTheDocument();
  });

  it('keeps the dialog open when the API refuses', async () => {
    serveAgenda(() => [lucas]);
    server.use(
      http.post(api('/admin/reservas/1/cancelar'), () =>
        HttpResponse.json(
          {
            detail: 'Esta reserva já terminou e não pode mais ser cancelada.',
            code: 'RESERVA_ENCERRADA',
          },
          { status: 422 },
        ),
      ),
    );
    const { user } = renderRoute(`/admin/agenda?data=${day}`, { user: adminUser });

    await user.click(
      await screen.findByRole('button', { name: 'Cancelar reserva de Lucas Andrade às 08:00' }),
    );
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText(/^Motivo/), 'Manutenção');
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar reserva' }));

    expect(
      await within(dialog).findByText('Esta reserva já terminou e não pode mais ser cancelada.'),
    ).toBeInTheDocument();
  });

  it('shows an empty state for a day without reservations', async () => {
    serveAgenda(() => []);
    renderRoute(`/admin/agenda?data=${day}`, { user: adminUser });

    expect(
      await screen.findByText('Nenhuma reserva neste dia com estes filtros.'),
    ).toBeInTheDocument();
  });

  it('blocks non-admin users', async () => {
    renderRoute('/admin/agenda');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Acesso restrito' }),
    ).toBeInTheDocument();
  });
});
