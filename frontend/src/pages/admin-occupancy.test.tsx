import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, onTestFinished, vi } from 'vitest';

import { EMPTY_STEP, heatStep, presetPeriod } from '@/domain/occupancy';
import type { OccupancyRead, ResourceOccupancyRead } from '@/lib/api/types';
import { adminUser, api, buildUser, renderRoute } from '@/test/render';
import { server } from '@/test/server';

function resource(id: number, nome: string, taxa: number): ResourceOccupancyRead {
  return {
    id,
    nome,
    tipo: 'SALA_ESTUDO',
    bloco: 'Bloco A',
    horas_disponiveis: 65,
    horas_reservadas: Math.round(65 * taxa * 10) / 10,
    taxa_ocupacao: taxa,
    reservas: 12,
    cancelamentos: 2,
    nao_comparecimentos: 1,
    horas_devolvidas: 1.5,
  };
}

const occupancy: OccupancyRead = {
  periodo: { inicio: '2026-09-14', fim: '2026-10-13' },
  resumo: {
    horas_disponiveis: 1300,
    horas_reservadas: 520,
    taxa_ocupacao: 0.4,
    reservas: 240,
    cancelamentos: 24,
    taxa_cancelamento: 0.091,
    checkins: 180,
    nao_comparecimentos: 20,
    taxa_comparecimento: 0.9,
    horas_devolvidas: 31.5,
  },
  mapa_calor: [
    { dia_semana: 1, hora: 8, taxa: 0 },
    { dia_semana: 1, hora: 19, taxa: 0.85 },
    { dia_semana: 2, hora: 8, taxa: 0.15 },
    { dia_semana: 2, hora: 19, taxa: 0.55 },
  ],
  recursos: [
    resource(1, 'Sala de estudo 204', 0.82),
    resource(2, 'Laboratório Maker', 0.4),
    resource(3, 'Auditório Central', 0.05),
  ],
};

function serveOccupancy(): URLSearchParams[] {
  const requests: URLSearchParams[] = [];
  server.use(
    http.get(api('/admin/ocupacao'), ({ request }) => {
      requests.push(new URL(request.url).searchParams);
      return HttpResponse.json(occupancy);
    }),
    http.get(api('/admin/blocos'), () => HttpResponse.json([])),
  );
  return requests;
}

describe('occupancy heat steps', () => {
  it('keeps zero neutral and darkens with the rate', () => {
    expect(heatStep(0)).toBe(EMPTY_STEP);
    expect(heatStep(0.1).background).toBe('#9DB0DA');
    expect(heatStep(0.95).background).toBe('#041C40');
  });

  it('builds periods that end today', () => {
    expect(presetPeriod(7, '2026-10-13')).toEqual({ inicio: '2026-10-07', fim: '2026-10-13' });
  });
});

describe('occupancy dashboard', () => {
  it('leads with occupancy, attendance, returned hours and cancellations', async () => {
    serveOccupancy();
    renderRoute('/admin/ocupacao', { user: adminUser });

    const summary = await screen.findByRole('region', { name: 'Resumo' });
    expect(within(summary).getByText('40%')).toBeVisible();
    expect(within(summary).getByText('90%')).toBeVisible();
    expect(within(summary).getByText('31,5 h')).toBeVisible();
    expect(within(summary).getByText('9%')).toBeVisible();
    expect(within(summary).getByText('180 check-ins e 20 reservas sem ninguém')).toBeVisible();
  });

  it('writes the rate inside every heatmap cell and explains the colors', async () => {
    serveOccupancy();
    renderRoute('/admin/ocupacao', { user: adminUser });

    const heatmap = await screen.findByRole('table', { name: /Parte do tempo disponível/ });
    expect(within(heatmap).getByRole('columnheader', { name: 'Seg' })).toBeInTheDocument();
    const evening = within(heatmap).getByRole('row', { name: /19:00/ });
    expect(within(evening).getByText('85%')).toBeVisible();
    expect(within(evening).getByText('55%')).toBeVisible();
    const legend = screen.getByRole('list', { name: 'Legenda do mapa de calor' });
    expect(within(legend).getAllByRole('listitem')).toHaveLength(6);
  });

  it('ranks the most and the least used spaces', async () => {
    serveOccupancy();
    renderRoute('/admin/ocupacao', { user: adminUser });

    const most = await screen.findByRole('region', { name: 'Mais usados' });
    expect(within(most).getAllByRole('listitem')[0]).toHaveTextContent('Sala de estudo 204');
    const least = screen.getByRole('region', { name: 'Menos usados' });
    expect(within(least).getAllByRole('listitem')[0]).toHaveTextContent('Auditório Central');
    expect(screen.getByRole('table', { name: 'Ocupação por recurso' })).toBeInTheDocument();
  });

  it('changes the period from the presets and keeps it in the URL', async () => {
    const requests = serveOccupancy();
    const { user, router } = renderRoute('/admin/ocupacao', { user: adminUser });

    await user.click(await screen.findByRole('button', { name: 'Últimos 7 dias' }));

    await waitFor(() => expect(router.state.location.search).toMatch(/inicio=.*&fim=/));
    await waitFor(() => expect(requests.at(-1)?.get('inicio')).not.toBeNull());
  });

  it('downloads the CSV with the BOM Excel needs', async () => {
    serveOccupancy();
    server.use(
      http.get(
        api('/admin/ocupacao.csv'),
        () =>
          new HttpResponse('Recurso;Bloco\r\nSala de estudo 204;Bloco A\r\n', {
            headers: { 'Content-Type': 'text/csv; charset=utf-8' },
          }),
      ),
    );
    const blobs: Blob[] = [];
    // Só os dois métodos estáticos: o construtor de URL continua o de verdade (roteador e MSW).
    const { createObjectURL, revokeObjectURL } = URL;
    URL.createObjectURL = (blob: Blob) => {
      blobs.push(blob);
      return 'blob:ocupacao';
    };
    URL.revokeObjectURL = () => {};
    onTestFinished(() => {
      URL.createObjectURL = createObjectURL;
      URL.revokeObjectURL = revokeObjectURL;
    });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const { user } = renderRoute('/admin/ocupacao', { user: adminUser });

    const csvButton = await screen.findByRole('button', { name: 'Baixar CSV' });
    await waitFor(() => expect(csvButton).toBeEnabled());
    await user.click(csvButton);

    await waitFor(() => expect(click).toHaveBeenCalledOnce());
    const blob = blobs[0];
    if (!blob) throw new Error('O CSV não foi gerado.');
    // O BOM do UTF-8 (EF BB BF) precisa estar nos bytes; text() o descartaria ao decodificar.
    expect([...new Uint8Array(await blob.arrayBuffer()).slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    expect(await blob.text()).toContain('Sala de estudo 204;Bloco A');
  });

  it('is only for the administration', async () => {
    renderRoute('/admin/ocupacao', { user: buildUser() });

    expect(await screen.findByRole('heading', { level: 1, name: 'Acesso restrito' })).toBeVisible();
  });
});
