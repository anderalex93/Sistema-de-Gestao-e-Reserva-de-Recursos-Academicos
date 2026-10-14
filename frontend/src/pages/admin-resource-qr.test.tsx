import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import type { ResourceAdminRead } from '@/lib/api/types';
import { adminUser, api, buildUser, renderRoute } from '@/test/render';
import { server } from '@/test/server';

function resource(overrides: Partial<ResourceAdminRead> = {}): ResourceAdminRead {
  return {
    id: 204,
    nome: 'Sala de estudo 204',
    tipo: 'SALA_ESTUDO',
    capacidade: 6,
    andar: '1º andar',
    descricao: null,
    ativo: true,
    bloco: { id: 1, nome: 'Bloco A', descricao: null, ativo: true },
    caracteristicas: [],
    checkin_token: 'qr-antigo',
    ...overrides,
  };
}

describe('door QR poster', () => {
  it('shows a printable poster with the check-in QR and its link', async () => {
    server.use(http.get(api('/admin/recursos/204'), () => HttpResponse.json(resource())));
    renderRoute('/admin/recursos/204/qr', { user: adminUser });

    const poster = await screen.findByRole('region', {
      name: 'Cartaz de check-in de Sala de estudo 204',
    });
    expect(within(poster).getByTitle('QR de check-in de Sala de estudo 204')).toBeInTheDocument();
    expect(within(poster).getByText(`${window.location.origin}/checkin/qr-antigo`)).toBeVisible();
    expect(within(poster).getByText(/Sem check-in até 15 minutos/)).toBeVisible();
    expect(screen.getByRole('button', { name: 'Imprimir' })).toBeVisible();
  });

  it('replaces the QR after confirmation, invalidating the printed one', async () => {
    let current = resource();
    server.use(
      http.get(api('/admin/recursos/204'), () => HttpResponse.json(current)),
      http.post(api('/admin/recursos/204/checkin/renovar'), () => {
        current = resource({ checkin_token: 'qr-novo' });
        return HttpResponse.json(current);
      }),
    );
    const { user } = renderRoute('/admin/recursos/204/qr', { user: adminUser });

    await user.click(await screen.findByRole('button', { name: 'Gerar novo QR' }));
    const dialog = screen.getByRole('dialog', { name: /Gerar um novo QR/ });
    expect(within(dialog).getByText(/deixa de funcionar na hora/)).toBeVisible();
    await user.click(within(dialog).getByRole('button', { name: 'Gerar novo QR' }));

    expect(await screen.findByText(`${window.location.origin}/checkin/qr-novo`)).toBeVisible();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('is only for the administration', async () => {
    renderRoute('/admin/recursos/204/qr', { user: buildUser() });

    expect(await screen.findByRole('heading', { level: 1, name: 'Acesso restrito' })).toBeVisible();
  });
});
