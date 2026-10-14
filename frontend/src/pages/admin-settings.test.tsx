import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import type { CampusSettingsRead, CampusSettingsUpdate } from '@/lib/api/types';
import { adminUser, api, buildUser, renderRoute } from '@/test/render';
import { server } from '@/test/server';

function settings(overrides: Partial<CampusSettingsRead> = {}): CampusSettingsRead {
  return {
    horarios: [
      ...[1, 2, 3, 4, 5].map((dia_semana) => ({
        dia_semana,
        abertura: '08:00:00',
        fechamento: '21:00:00',
      })),
      { dia_semana: 6, abertura: '08:00:00', fechamento: '12:00:00' },
    ],
    duracao_max_minutos: 240,
    antecedencia_max_dias: 14,
    limite_ativas_aluno: 3,
    limite_ativas_professor: 10,
    checkin_tolerancia_min: 15,
    checkin_antecedencia_min: 15,
    origem: 'AMBIENTE',
    atualizado_em: null,
    atualizado_por: null,
    ...overrides,
  };
}

function serveSettings(initial = settings()) {
  const sent: CampusSettingsUpdate[] = [];
  let current = initial;
  server.use(
    http.get(api('/admin/configuracoes'), () => HttpResponse.json(current)),
    http.put(api('/admin/configuracoes'), async ({ request }) => {
      const body = (await request.json()) as CampusSettingsUpdate;
      sent.push(body);
      current = settings({
        ...body,
        horarios: body.horarios.map((day) => ({
          dia_semana: day.dia_semana,
          abertura: `${day.abertura}:00`,
          fechamento: `${day.fechamento}:00`,
        })),
        origem: 'ADMINISTRACAO',
        atualizado_em: '2026-10-14T13:20:00Z',
        atualizado_por: 'Marta Silva',
      });
      return HttpResponse.json(current);
    }),
  );
  return sent;
}

describe('admin settings', () => {
  it('shows the current hours and rules and says they come from the server', async () => {
    serveSettings();
    renderRoute('/admin/configuracoes', { user: adminUser });

    expect(
      await screen.findByText('Valores padrão do servidor. Ninguém alterou por aqui ainda.'),
    ).toBeVisible();
    expect(screen.getByRole('checkbox', { name: 'Segunda: aberto' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Domingo: aberto' })).not.toBeChecked();
    expect(screen.getByRole('combobox', { name: 'Abertura de domingo' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(
      screen.getByRole('combobox', { name: 'Duração máxima de uma reserva' }),
    ).toHaveTextContent('4h');
    expect(screen.getByLabelText('Reservas futuras por aluno')).toHaveValue('3');
  });

  it('opens Sunday, changes the rules and saves what the API expects', async () => {
    const sent = serveSettings();
    const { user } = renderRoute('/admin/configuracoes', { user: adminUser });

    await user.click(await screen.findByRole('checkbox', { name: 'Domingo: aberto' }));
    await user.click(screen.getByRole('combobox', { name: 'Fechamento de domingo' }));
    await user.click(await screen.findByRole('option', { name: '12:00' }));
    await user.click(screen.getByRole('combobox', { name: 'Duração máxima de uma reserva' }));
    await user.click(await screen.findByRole('option', { name: '2h' }));
    const studentLimit = screen.getByLabelText('Reservas futuras por aluno');
    await user.clear(studentLimit);
    await user.type(studentLimit, '2');
    await user.click(screen.getByRole('combobox', { name: 'Prazo para o check-in' }));
    await user.click(await screen.findByRole('option', { name: 'Desligado: check-in opcional' }));
    await user.click(screen.getByRole('button', { name: 'Salvar configurações' }));

    expect(await screen.findByText('Configurações salvas.')).toBeVisible();
    expect(sent).toEqual([
      {
        horarios: [
          ...[1, 2, 3, 4, 5].map((dia_semana) => ({
            dia_semana,
            abertura: '08:00',
            fechamento: '21:00',
          })),
          { dia_semana: 6, abertura: '08:00', fechamento: '12:00' },
          { dia_semana: 7, abertura: '08:00', fechamento: '12:00' },
        ],
        duracao_max_minutos: 120,
        antecedencia_max_dias: 14,
        limite_ativas_aluno: 2,
        limite_ativas_professor: 10,
        checkin_tolerancia_min: 0,
        checkin_antecedencia_min: 15,
      },
    ]);
    expect(await screen.findByText(/Última alteração por Marta Silva em/)).toBeVisible();
  });

  it('points out a day that closes before it opens and a campus closed every day', async () => {
    const sent = serveSettings();
    const { user } = renderRoute('/admin/configuracoes', { user: adminUser });

    await user.click(await screen.findByRole('combobox', { name: 'Fechamento de segunda' }));
    await user.click(await screen.findByRole('option', { name: '07:00' }));
    await user.click(screen.getByRole('button', { name: 'Salvar configurações' }));

    expect(await screen.findByText('O fechamento precisa ser depois da abertura.')).toBeVisible();

    // Um clique de cada vez, como a pessoa faria.
    await ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'].reduce(
      (previous, day) =>
        previous.then(() => user.click(screen.getByRole('checkbox', { name: `${day}: aberto` }))),
      Promise.resolve(),
    );
    await user.click(screen.getByRole('button', { name: 'Salvar configurações' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Deixe o campus aberto em pelo menos um dia.',
    );
    expect(sent).toEqual([]);
  });

  it('shows the API reason when saving fails', async () => {
    serveSettings();
    server.use(
      http.put(api('/admin/configuracoes'), () =>
        HttpResponse.json(
          { detail: 'Serviço indisponível no momento.', code: 'SERVICO_INDISPONIVEL' },
          { status: 503 },
        ),
      ),
    );
    const { user } = renderRoute('/admin/configuracoes', { user: adminUser });

    await user.click(await screen.findByRole('button', { name: 'Salvar configurações' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Serviço indisponível no momento.');
  });

  it('is listed in the administration and only for administrators', async () => {
    serveSettings();
    renderRoute('/admin', { user: adminUser });
    expect(await screen.findByRole('link', { name: /^Configurações/ })).toHaveAttribute(
      'href',
      '/admin/configuracoes',
    );
  });

  it('blocks non-admin users', async () => {
    renderRoute('/admin/configuracoes', { user: buildUser() });

    expect(await screen.findByRole('heading', { level: 1 })).not.toHaveTextContent('Configurações');
  });
});
