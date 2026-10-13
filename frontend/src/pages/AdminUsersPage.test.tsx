import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import type { Page, UserRead } from '@/lib/api/types';
import { adminUser, api, buildUser, renderRoute } from '@/test/render';
import { server } from '@/test/server';

function page(items: UserRead[], total = items.length): Page<UserRead> {
  return { items, total, page: 1, per_page: 20, total_pages: total ? 1 : 0 };
}

const maria = buildUser({
  id: 2,
  nome: 'Maria Souza',
  email: 'maria@umj.edu.br',
  perfil: 'PROFESSOR',
});

describe('admin users', () => {
  it('lists accounts in the paginated envelope', async () => {
    server.use(http.get(api('/admin/usuarios'), () => HttpResponse.json(page([adminUser, maria]))));
    renderRoute('/admin/usuarios', { user: adminUser });

    const table = await screen.findByRole('table', { name: 'Usuários' });
    expect(await within(table).findByText('Maria Souza')).toBeInTheDocument();
    expect(within(table).getByText('Professor')).toBeInTheDocument();
    expect(screen.getByText('1 a 2 de 2')).toBeInTheDocument();
  });

  it('searches by name, e-mail or registration', async () => {
    const searches: (string | null)[] = [];
    server.use(
      http.get(api('/admin/usuarios'), ({ request }) => {
        const busca = new URL(request.url).searchParams.get('busca');
        searches.push(busca);
        return HttpResponse.json(busca ? page([maria]) : page([adminUser, maria]));
      }),
    );
    const { user } = renderRoute('/admin/usuarios', { user: adminUser });
    await screen.findByText('Maria Souza');

    await user.type(screen.getByRole('textbox', { name: 'Buscar usuários' }), 'maria');

    await waitFor(() => expect(searches).toContain('maria'));
    await waitFor(() =>
      expect(screen.queryByText('Admin EduSpace', { selector: 'td' })).toBeNull(),
    );
  });

  it('creates an account with the chosen role', async () => {
    let created: unknown = null;
    server.use(
      http.get(api('/admin/usuarios'), () =>
        HttpResponse.json(created ? page([adminUser, maria]) : page([adminUser])),
      ),
      http.post(api('/admin/usuarios'), async ({ request }) => {
        created = await request.json();
        return HttpResponse.json(maria, { status: 201 });
      }),
    );
    const { user } = renderRoute('/admin/usuarios', { user: adminUser });
    await screen.findByRole('table', { name: 'Usuários' });

    await user.click(screen.getByRole('button', { name: 'Nova conta' }));
    const dialog = await screen.findByRole('dialog', { name: 'Nova conta' });
    await user.type(within(dialog).getByLabelText(/Nome completo/), 'Maria Souza');
    await user.type(within(dialog).getByLabelText(/E-mail/), 'maria@umj.edu.br');
    await user.type(within(dialog).getByLabelText(/Senha inicial/), 'Senha123');
    await user.click(within(dialog).getByRole('combobox'));
    await user.click(await screen.findByRole('option', { name: 'Professor' }));
    await user.click(within(dialog).getByRole('button', { name: 'Criar conta' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(created).toEqual({
      nome: 'Maria Souza',
      email: 'maria@umj.edu.br',
      senha: 'Senha123',
      perfil: 'PROFESSOR',
    });
    expect(await screen.findByRole('status')).toHaveTextContent('Conta de Maria Souza criada.');
    expect(await screen.findByText('Maria Souza', { selector: 'td' })).toBeInTheDocument();
  });

  it('keeps the dialog open and marks the e-mail on conflict', async () => {
    server.use(
      http.get(api('/admin/usuarios'), () => HttpResponse.json(page([adminUser]))),
      http.post(api('/admin/usuarios'), () =>
        HttpResponse.json(
          { detail: 'Este e-mail já possui conta.', code: 'EMAIL_JA_CADASTRADO' },
          { status: 409 },
        ),
      ),
    );
    const { user } = renderRoute('/admin/usuarios', { user: adminUser });
    await screen.findByRole('table', { name: 'Usuários' });

    await user.click(screen.getByRole('button', { name: 'Nova conta' }));
    const dialog = await screen.findByRole('dialog', { name: 'Nova conta' });
    await user.type(within(dialog).getByLabelText(/Nome completo/), 'Admin Dois');
    await user.type(within(dialog).getByLabelText(/E-mail/), 'admin@umj.edu.br');
    await user.type(within(dialog).getByLabelText(/Senha inicial/), 'Senha123');
    await user.click(within(dialog).getByRole('button', { name: 'Criar conta' }));

    expect(await within(dialog).findByText('Este e-mail já possui conta.')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('shows an empty state for searches without results', async () => {
    server.use(http.get(api('/admin/usuarios'), () => HttpResponse.json(page([]))));
    renderRoute('/admin/usuarios', { user: adminUser });

    expect(await screen.findByText('Nenhuma conta cadastrada ainda.')).toBeInTheDocument();
  });

  it('blocks non-admin users', async () => {
    renderRoute('/admin/usuarios');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Acesso restrito' }),
    ).toBeInTheDocument();
  });

  it('shows the admin menu only to admins', async () => {
    renderRoute('/');
    const nav = await screen.findByRole('navigation', { name: 'Navegação principal' });
    expect(within(nav).queryByRole('link', { name: 'Administração' })).toBeNull();
  });
});
