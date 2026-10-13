import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { api, buildUser, renderRoute } from '@/test/render';
import { server } from '@/test/server';

const lucas = buildUser();

function tokenFor(user = lucas) {
  return { access_token: 'token-novo', token_type: 'bearer', expires_in: 28_800, usuario: user };
}

describe('login', () => {
  it('signs in and returns to the page the visitor wanted', async () => {
    server.use(http.post(api('/auth/login'), () => HttpResponse.json(tokenFor())));
    const { user } = renderRoute('/minhas-reservas', { user: null });

    expect(await screen.findByRole('heading', { level: 1, name: 'Entrar' })).toBeInTheDocument();
    await user.type(screen.getByLabelText(/E-mail/), 'lucas@umj.edu.br');
    await user.type(screen.getByLabelText(/^Senha/), 'Senha123');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Minhas reservas' }),
    ).toBeInTheDocument();
    expect(window.localStorage.getItem('eduspace.token')).toBe('token-novo');
  });

  it('shows the friendly server message on wrong credentials', async () => {
    server.use(
      http.post(api('/auth/login'), () =>
        HttpResponse.json(
          { detail: 'E-mail ou senha incorretos.', code: 'CREDENCIAIS_INVALIDAS' },
          { status: 401 },
        ),
      ),
    );
    const { user } = renderRoute('/login', { user: null });

    await user.type(await screen.findByLabelText(/E-mail/), 'lucas@umj.edu.br');
    await user.type(screen.getByLabelText(/^Senha/), 'Errada123');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha incorretos.');
    expect(screen.getByRole('heading', { level: 1, name: 'Entrar' })).toBeInTheDocument();
  });

  it('validates before calling the API', async () => {
    const { user } = renderRoute('/login', { user: null });

    await user.click(await screen.findByRole('button', { name: 'Entrar' }));

    expect(await screen.findByText('Informe o e-mail.')).toBeInTheDocument();
    expect(screen.getByLabelText(/E-mail/)).toHaveAttribute('aria-invalid', 'true');
  });

  it('lets the visitor reveal the password', async () => {
    const { user } = renderRoute('/login', { user: null });
    const password = await screen.findByLabelText(/^Senha/);

    await user.click(screen.getByRole('button', { name: 'Mostrar senha' }));

    expect(password).toHaveAttribute('type', 'text');
  });

  it('sends logged users away from the login page', async () => {
    renderRoute('/login');

    expect(await screen.findByRole('heading', { level: 1, name: 'Início' })).toBeInTheDocument();
  });
});

describe('signup', () => {
  it('creates the account, signs in and opens the dashboard', async () => {
    let received: unknown = null;
    server.use(
      http.post(api('/auth/cadastro'), async ({ request }) => {
        received = await request.json();
        return HttpResponse.json(lucas, { status: 201 });
      }),
      http.post(api('/auth/login'), () => HttpResponse.json(tokenFor())),
    );
    const { user } = renderRoute('/cadastro', { user: null });

    await user.type(await screen.findByLabelText(/Nome completo/), 'Lucas Andrade');
    await user.type(screen.getByLabelText(/E-mail/), 'lucas@gmail.com');
    await user.type(screen.getByLabelText(/^Senha/), 'Senha123');
    await user.type(screen.getByLabelText(/Repita a senha/), 'Senha123');
    await user.click(screen.getByRole('button', { name: 'Criar conta' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Início' })).toBeInTheDocument();
    expect(received).toEqual({
      nome: 'Lucas Andrade',
      email: 'lucas@gmail.com',
      senha: 'Senha123',
    });
    expect(await screen.findByRole('status')).toHaveTextContent('Conta criada');
  });

  it('points a duplicated e-mail to the e-mail field', async () => {
    server.use(
      http.post(api('/auth/cadastro'), () =>
        HttpResponse.json(
          { detail: 'Este e-mail já possui conta.', code: 'EMAIL_JA_CADASTRADO' },
          { status: 409 },
        ),
      ),
    );
    const { user } = renderRoute('/cadastro', { user: null });

    await user.type(await screen.findByLabelText(/Nome completo/), 'Lucas Andrade');
    await user.type(screen.getByLabelText(/E-mail/), 'lucas@gmail.com');
    await user.type(screen.getByLabelText(/^Senha/), 'Senha123');
    await user.type(screen.getByLabelText(/Repita a senha/), 'Senha123');
    await user.click(screen.getByRole('button', { name: 'Criar conta' }));

    expect(await screen.findByText('Este e-mail já possui conta.')).toBeInTheDocument();
    expect(screen.getByLabelText(/E-mail/)).toHaveAttribute('aria-invalid', 'true');
  });

  it('checks password rules and confirmation', async () => {
    const { user } = renderRoute('/cadastro', { user: null });

    await user.type(await screen.findByLabelText(/^Senha/), 'somenteletras');
    await user.type(screen.getByLabelText(/Repita a senha/), 'outra');
    await user.click(screen.getByRole('button', { name: 'Criar conta' }));

    expect(await screen.findByText('A senha precisa ter letras e números.')).toBeInTheDocument();
    expect(screen.getByText('As senhas não são iguais.')).toBeInTheDocument();
  });
});

describe('session', () => {
  it('sends visitors of private pages to the login', async () => {
    renderRoute('/conta', { user: null });

    expect(await screen.findByRole('heading', { level: 1, name: 'Entrar' })).toBeInTheDocument();
  });

  it('ends an expired session and asks to sign in again', async () => {
    window.localStorage.setItem('eduspace.token', 'expirado');
    server.use(
      http.get(api('/auth/me'), () =>
        HttpResponse.json(
          { detail: 'Sua sessão expirou.', code: 'SESSAO_INVALIDA' },
          { status: 401 },
        ),
      ),
    );
    renderRoute('/conta', { user: null });

    expect(await screen.findByRole('heading', { level: 1, name: 'Entrar' })).toBeInTheDocument();
    expect(await screen.findByRole('status')).toHaveTextContent('Sua sessão expirou');
    expect(window.localStorage.getItem('eduspace.token')).toBeNull();
  });

  it('offers a retry when the API is unreachable', async () => {
    window.localStorage.setItem('eduspace.token', 'valido');
    server.use(http.get(api('/auth/me'), () => HttpResponse.error()));
    renderRoute('/', { user: null });

    expect(
      await screen.findByRole('heading', { name: 'Não foi possível carregar sua sessão' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tentar de novo' })).toBeInTheDocument();
  });

  it('shows account data and signs out', async () => {
    const { user } = renderRoute('/conta', { user: buildUser({ matricula: '2024001' }) });

    expect(await screen.findByText('2024001')).toBeInTheDocument();
    expect(screen.getByText('Aluno')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Sair da conta' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Entrar' })).toBeInTheDocument();
    expect(window.localStorage.getItem('eduspace.token')).toBeNull();
  });

  it('shows the logged user in the top bar', async () => {
    renderRoute('/');
    await screen.findByRole('heading', { level: 1, name: 'Início' });

    const banner = screen.getAllByRole('banner')[0];
    expect(banner).toBeDefined();
    if (!banner) return;
    expect(within(banner).getByRole('link', { name: 'Lucas Andrade' })).toHaveAttribute(
      'href',
      '/conta',
    );
    await waitFor(() =>
      expect(within(banner).getByRole('button', { name: 'Sair' })).toBeInTheDocument(),
    );
  });
});
