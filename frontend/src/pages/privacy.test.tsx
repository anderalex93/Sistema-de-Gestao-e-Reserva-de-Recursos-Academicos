import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { MyDataExport } from '@/lib/api/types';
import { adminUser, api, buildUser, renderRoute } from '@/test/render';
import { server } from '@/test/server';

const lucas = buildUser();

// Com `isolate: false` o ambiente é compartilhado entre arquivos: o que for trocado em `URL`
// volta ao original no fim de cada teste.
const originalUrl = {
  createObjectURL: URL.createObjectURL.bind(URL),
  revokeObjectURL: URL.revokeObjectURL.bind(URL),
};

afterEach(() => {
  vi.restoreAllMocks();
  Object.assign(URL, originalUrl);
});

describe('legal pages', () => {
  it('shows the privacy notice to visitors, with rights and retention', async () => {
    renderRoute('/privacidade', { user: null });

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Aviso de Privacidade' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Seus direitos/ })).toBeInTheDocument();
    expect(screen.getByText(/até 2 anos depois da data/)).toBeInTheDocument();
    const footer = screen.getByRole('navigation', { name: 'Rodapé' });
    expect(within(footer).getByRole('link', { name: 'Termos de Uso' })).toHaveAttribute(
      'href',
      '/termos',
    );
  });

  it('shows the terms of use with the cancellation rule', async () => {
    renderRoute('/termos', { user: null });

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Termos de Uso' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/até 30 minutos antes do início/)).toBeInTheDocument();
  });
});

describe('first access of an account created by the admin', () => {
  it('asks for acceptance before opening the app', async () => {
    let accepted = false;
    server.use(
      http.post(api('/auth/me/aceite-termos'), () => {
        accepted = true;
        return HttpResponse.json({ ...lucas, aceite_termos_em: '2026-10-14T12:00:00Z' });
      }),
    );
    const { user } = renderRoute('/', { user: { ...lucas, aceite_termos_em: null } });

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Antes de continuar' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Navegação principal' })).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Li e concordo, continuar' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Início' })).toBeInTheDocument();
    expect(accepted).toBe(true);
  });

  it('lets the person leave without accepting', async () => {
    const { user, router } = renderRoute('/', { user: { ...lucas, aceite_termos_em: null } });

    await user.click(await screen.findByRole('button', { name: 'Sair' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
  });
});

describe('my data', () => {
  it('downloads every stored data as a JSON file', async () => {
    const exported: MyDataExport = {
      gerado_em: '2026-10-14T12:00:00Z',
      conta: lucas,
      reservas: [],
    };
    server.use(http.get(api('/auth/me/dados'), () => HttpResponse.json(exported)));
    const createUrl = vi.fn<(blob: Blob) => string>(() => 'blob:dados');
    Object.assign(URL, {
      createObjectURL: createUrl,
      revokeObjectURL: vi.fn<(url: string) => void>(),
    });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const { user } = renderRoute('/conta');

    await user.click(await screen.findByRole('button', { name: 'Baixar meus dados' }));

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Arquivo com os seus dados baixado.',
    );
    expect(click).toHaveBeenCalledOnce();
    const blob = createUrl.mock.calls[0]?.[0];
    expect(JSON.parse((await blob?.text()) ?? '{}')).toEqual(exported);
  });

  it('marks a wrong password when deleting the account', async () => {
    server.use(
      http.post(api('/auth/me/exclusao'), () =>
        HttpResponse.json(
          { detail: 'Senha incorreta. Confira e tente de novo.', code: 'SENHA_INCORRETA' },
          { status: 422 },
        ),
      ),
    );
    const { user } = renderRoute('/conta');

    await user.click(await screen.findByRole('button', { name: 'Excluir conta' }));
    const dialog = await screen.findByRole('dialog', { name: 'Excluir a sua conta?' });
    await user.type(within(dialog).getByLabelText(/^Senha atual/), 'Errada123');
    await user.click(within(dialog).getByRole('button', { name: 'Excluir conta' }));

    expect(
      await within(dialog).findByText('Senha incorreta. Confira e tente de novo.'),
    ).toBeInTheDocument();
  });

  it('deletes the account and ends the session', async () => {
    let sent: unknown = null;
    server.use(
      http.post(api('/auth/me/exclusao'), async ({ request }) => {
        sent = await request.json();
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const { user, router } = renderRoute('/conta');

    await user.click(await screen.findByRole('button', { name: 'Excluir conta' }));
    const dialog = await screen.findByRole('dialog', { name: 'Excluir a sua conta?' });
    await user.type(within(dialog).getByLabelText(/^Senha atual/), 'Senha123');
    await user.click(within(dialog).getByRole('button', { name: 'Excluir conta' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
    expect(sent).toEqual({ senha: 'Senha123' });
    expect(window.localStorage.getItem('eduspace.token')).toBeNull();
    expect(await screen.findByRole('status')).toHaveTextContent('Sua conta foi excluída.');
  });

  it('does not offer self deletion to administrators', async () => {
    renderRoute('/conta', { user: adminUser });

    expect(await screen.findByRole('button', { name: 'Baixar meus dados' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Excluir conta' })).toBeNull();
  });
});
