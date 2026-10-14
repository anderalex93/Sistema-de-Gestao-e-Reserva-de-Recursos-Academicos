import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { campusToUtcIso } from '@/domain/schedule';
import type { CheckinStatusRead, ReservationRead } from '@/lib/api/types';
import { buildResource, nextWeekday } from '@/test/catalog';
import { api, renderRoute } from '@/test/render';
import { server } from '@/test/server';

const TOKEN = 'porta-sala-204';
const day = nextWeekday();
const resource = buildResource();

function reservation(overrides: Partial<ReservationRead> = {}): ReservationRead {
  return {
    id: 10,
    codigo: 'EDU-7K3F9Q',
    status: 'CONFIRMADA',
    inicio: campusToUtcIso(day, '19:00'),
    fim: campusToUtcIso(day, '21:00'),
    finalidade: null,
    qtd_participantes: null,
    recurso: resource,
    usuario_id: 1,
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

function status(overrides: Partial<CheckinStatusRead>): CheckinStatusRead {
  return {
    recurso: {
      id: resource.id,
      nome: resource.nome,
      tipo: resource.tipo,
      andar: resource.andar,
      bloco: resource.bloco,
    },
    situacao: 'SEM_RESERVA',
    reserva: null,
    abre_em: null,
    pode_encerrar: false,
    ...overrides,
  };
}

function serveStatus(body: CheckinStatusRead) {
  server.use(http.get(api(`/checkin/${TOKEN}`), () => HttpResponse.json(body)));
}

describe('door QR check-in', () => {
  it('confirms presence with one tap when the window is open', async () => {
    serveStatus(status({ situacao: 'DISPONIVEL', reserva: reservation() }));
    let posted = false;
    server.use(
      http.post(api(`/checkin/${TOKEN}`), () => {
        posted = true;
        return HttpResponse.json(reservation({ checkin_em: campusToUtcIso(day, '18:57') }));
      }),
    );
    const { user } = renderRoute(`/checkin/${TOKEN}`);

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Sala de estudo 204' }),
    ).toBeVisible();
    expect(screen.getByText(/Sem isso, a sala é liberada/)).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Confirmar presença' }));

    expect(await screen.findByText('Presença confirmada')).toBeVisible();
    expect(screen.getByText('às 18:57')).toBeVisible();
    expect(posted).toBe(true);
    expect(screen.getByRole('link', { name: 'Ver comprovante' })).toHaveAttribute(
      'href',
      '/comprovantes/EDU-7K3F9Q',
    );
  });

  it('shows the presence already confirmed without posting again', async () => {
    serveStatus(
      status({
        situacao: 'FEITO',
        reserva: reservation({ checkin_em: campusToUtcIso(day, '19:02') }),
      }),
    );
    renderRoute(`/checkin/${TOKEN}`);

    expect(await screen.findByText('Presença confirmada')).toBeVisible();
    expect(screen.getByText('às 19:02')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Confirmar presença' })).toBeNull();
  });

  it('tells when the check-in opens when the person arrives early', async () => {
    serveStatus(
      status({
        situacao: 'CEDO',
        reserva: reservation(),
        abre_em: campusToUtcIso(day, '18:45'),
      }),
    );
    renderRoute(`/checkin/${TOKEN}`);

    expect(await screen.findByText('Ainda é cedo para o check-in')).toBeVisible();
    expect(screen.getByText('18:45')).toBeVisible();
  });

  it('explains a reservation released for lack of check-in and offers to book again', async () => {
    serveStatus(
      status({
        situacao: 'LIBERADA',
        reserva: reservation({
          status: 'NAO_COMPARECEU',
          liberada_em: campusToUtcIso(day, '19:15'),
        }),
      }),
    );
    renderRoute(`/checkin/${TOKEN}`);

    expect(await screen.findByText('Esta reserva foi liberada')).toBeVisible();
    expect(screen.getByText(/voltou a ficar livre às 19:15/)).toBeVisible();
    expect(screen.getByRole('link', { name: 'Ver horários deste espaço' })).toHaveAttribute(
      'href',
      `/recursos/${resource.id}`,
    );
  });

  it('points to the free times when the person has no reservation there', async () => {
    serveStatus(status({ situacao: 'SEM_RESERVA' }));
    renderRoute(`/checkin/${TOKEN}`);

    expect(await screen.findByText('Você não tem reserva aqui agora')).toBeVisible();
    expect(screen.getByRole('link', { name: 'Ver horários deste espaço' })).toBeVisible();
  });

  it('says the QR was not recognized for an old or wrong code', async () => {
    server.use(
      http.get(api(`/checkin/${TOKEN}`), () =>
        HttpResponse.json(
          {
            detail: 'Este QR Code não corresponde a nenhum espaço disponível.',
            code: 'QR_INVALIDO',
          },
          { status: 404 },
        ),
      ),
    );
    renderRoute(`/checkin/${TOKEN}`);

    expect(
      await screen.findByRole('heading', { level: 1, name: 'QR Code não reconhecido' }),
    ).toBeVisible();
    expect(screen.getByText(/não corresponde a nenhum espaço/)).toBeVisible();
  });

  it('shows the API reason when the check-in is refused', async () => {
    serveStatus(status({ situacao: 'DISPONIVEL', reserva: reservation() }));
    server.use(
      http.post(api(`/checkin/${TOKEN}`), () =>
        HttpResponse.json(
          { detail: 'Esta reserva foi liberada por falta de check-in.', code: 'RESERVA_LIBERADA' },
          { status: 409 },
        ),
      ),
    );
    const { user } = renderRoute(`/checkin/${TOKEN}`);

    await user.click(await screen.findByRole('button', { name: 'Confirmar presença' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('liberada por falta de check-in');
  });

  it('asks a visitor to sign in and comes back to the QR page', async () => {
    const { router } = renderRoute(`/checkin/${TOKEN}`, { user: null });

    expect(await screen.findByRole('heading', { level: 1, name: 'Entrar' })).toBeVisible();
    await waitFor(() =>
      expect(router.state.location.state).toMatchObject({
        from: { pathname: `/checkin/${TOKEN}` },
      }),
    );
  });
});

describe('ending the use from the door QR', () => {
  const checkedIn = () => reservation({ checkin_em: campusToUtcIso(day, '18:57') });

  it('offers to end the use after the check-in and shows the room free', async () => {
    let ended = false;
    const endedReservation = reservation({
      checkin_em: campusToUtcIso(day, '18:57'),
      fim: campusToUtcIso(day, '19:30'),
      fim_previsto: campusToUtcIso(day, '21:00'),
      encerrada_em: campusToUtcIso(day, '19:12'),
    });
    server.use(
      http.get(api(`/checkin/${TOKEN}`), () =>
        HttpResponse.json(
          ended
            ? status({ situacao: 'ENCERRADA', reserva: endedReservation })
            : status({ situacao: 'FEITO', reserva: checkedIn(), pode_encerrar: true }),
        ),
      ),
      http.post(api('/reservas/10/encerrar'), () => {
        ended = true;
        return HttpResponse.json({
          ...endedReservation,
          pode_cancelar: false,
          pode_encerrar: false,
        });
      }),
    );
    const { user } = renderRoute(`/checkin/${TOKEN}`);

    expect(await screen.findByText('Presença confirmada')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Encerrar uso e liberar a sala' }));
    const dialog = await screen.findByRole('dialog', { name: 'Encerrar o uso agora?' });
    expect(dialog).toHaveTextContent('A sala fica livre a partir das 19:30.');
    await user.click(within(dialog).getByRole('button', { name: 'Sim, encerrar' }));

    expect(await screen.findByText('Uso encerrado', { selector: 'p' })).toBeVisible();
    expect(screen.getByText('às 19:12')).toBeVisible();
    expect(screen.getByText(/livre a partir das 19:30. Obrigado por liberar/)).toBeVisible();
  });

  it('does not offer to end before the reservation starts', async () => {
    serveStatus(status({ situacao: 'FEITO', reserva: checkedIn(), pode_encerrar: false }));
    renderRoute(`/checkin/${TOKEN}`);

    expect(await screen.findByText('Presença confirmada')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Encerrar uso e liberar a sala' })).toBeNull();
  });

  it('shows the API reason when ending fails', async () => {
    serveStatus(status({ situacao: 'FEITO', reserva: checkedIn(), pode_encerrar: true }));
    server.use(
      http.post(api('/reservas/10/encerrar'), () =>
        HttpResponse.json(
          {
            detail: 'Esta reserva já terminou: não há uso para encerrar.',
            code: 'RESERVA_ENCERRADA',
          },
          { status: 422 },
        ),
      ),
    );
    const { user } = renderRoute(`/checkin/${TOKEN}`);

    await user.click(await screen.findByRole('button', { name: 'Encerrar uso e liberar a sala' }));
    const dialog = await screen.findByRole('dialog', { name: 'Encerrar o uso agora?' });
    await user.click(within(dialog).getByRole('button', { name: 'Sim, encerrar' }));

    expect(await within(dialog).findByRole('alert')).toHaveTextContent('já terminou');
  });
});
