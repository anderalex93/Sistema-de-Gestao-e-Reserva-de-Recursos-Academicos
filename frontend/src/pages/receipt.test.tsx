import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { displayStatus } from '@/domain/reservation-status';
import type { ReceiptRead } from '@/lib/api/types';
import { api, renderRoute } from '@/test/render';
import { buildReceipt } from '@/test/reservations';
import { server } from '@/test/server';

function serveReceipt(receipt: ReceiptRead | null) {
  server.use(
    http.get(api('/reservas/comprovante/:codigo'), () =>
      receipt
        ? HttpResponse.json(receipt)
        : HttpResponse.json(
            { detail: 'Não encontramos.', code: 'COMPROVANTE_NAO_ENCONTRADO' },
            { status: 404 },
          ),
    ),
  );
}

describe('public receipt', () => {
  it('works without login and shows status, code, details and the QR code', async () => {
    serveReceipt(buildReceipt());
    renderRoute('/comprovantes/EDU-7K3F9Q', { user: null });

    const receipt = await screen.findByRole('article', { name: 'Comprovante EDU-7K3F9Q' });
    expect(within(receipt).getByText('Confirmada')).toBeInTheDocument();
    const text = receipt.textContent ?? '';
    for (const expected of [
      'Sala de estudo 204',
      'Bloco A · 1º andar',
      '19:00 às 21:00',
      'Lucas',
    ]) {
      expect(text).toContain(expected);
    }
    expect(within(receipt).getByTitle('QR code do comprovante EDU-7K3F9Q')).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Navegação principal' })).toBeNull();
  });

  it('makes a cancelled reservation impossible to miss', async () => {
    serveReceipt(buildReceipt({ status: 'CANCELADA', cancelada_em: '2026-10-13T12:00:00Z' }));
    renderRoute('/comprovantes/EDU-7K3F9Q', { user: null });

    const receipt = await screen.findByRole('article', { name: 'Comprovante EDU-7K3F9Q' });
    expect(within(receipt).getByText('Cancelada')).toBeInTheDocument();
    expect(within(receipt).getByText(/foi cancelada/)).toBeInTheDocument();
  });

  it('explains an unknown code', async () => {
    serveReceipt(null);
    renderRoute('/comprovantes/EDU-ZZZZZZ', { user: null });

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Comprovante não encontrado' }),
    ).toBeInTheDocument();
  });

  it('prints and copies the verification link', async () => {
    serveReceipt(buildReceipt());
    const print = vi.spyOn(window, 'print').mockImplementation(() => undefined);
    const { user } = renderRoute('/comprovantes/EDU-7K3F9Q', { user: null });
    const writeText = vi.spyOn(navigator.clipboard, 'writeText');

    await user.click(await screen.findByRole('button', { name: 'Imprimir ou salvar PDF' }));
    await user.click(screen.getByRole('button', { name: 'Copiar link' }));

    expect(print).toHaveBeenCalledOnce();
    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/comprovantes/EDU-7K3F9Q`);
    expect(await screen.findByText('Link do comprovante copiado.')).toBeInTheDocument();
  });
});

describe('display status', () => {
  it('derives "concluída" from a confirmed reservation that already ended', () => {
    const now = new Date('2030-01-01T12:00:00Z');
    expect(displayStatus('CONFIRMADA', '2030-01-01T11:00:00Z', now)).toBe('CONCLUIDA');
    expect(displayStatus('CONFIRMADA', '2030-01-01T13:00:00Z', now)).toBe('CONFIRMADA');
    expect(displayStatus('CANCELADA', '2030-01-01T11:00:00Z', now)).toBe('CANCELADA');
  });
});
