import { expect, test } from '@playwright/test';

import { ApiHelper, newUser } from './support/api';
import { loginThroughUi } from './support/flows';

test.describe('cadastro', () => {
  test('recusa e-mail inválido e cria a conta com o e-mail institucional', async ({ page }) => {
    const user = newUser();
    await page.goto('/cadastro');

    await page.getByLabel('Nome completo').fill(user.nome);
    await page.getByLabel('E-mail').fill('lucas.andrade');
    await page.getByRole('textbox', { name: 'Senha', exact: true }).fill(user.senha);
    await page.getByLabel('Repita a senha').fill(user.senha);
    await page.getByRole('checkbox', { name: /Li e concordo/ }).check();
    await page.getByRole('button', { name: 'Criar conta' }).click();

    const email = page.getByLabel('E-mail');
    await expect(email).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByText('Informe um e-mail válido, como nome@umj.edu.br.')).toBeVisible();

    // Fora do domínio institucional, quem recusa é a API.
    await email.fill('lucas.andrade@gmail.com');
    await page.getByRole('button', { name: 'Criar conta' }).click();
    await expect(
      page.getByText('Use o seu e-mail institucional para criar a conta.'),
    ).toBeVisible();

    await email.fill(user.email);
    await page.getByRole('button', { name: 'Criar conta' }).click();

    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { level: 1, name: 'Início' })).toBeVisible();
    await expect(page.getByRole('status').filter({ hasText: 'Conta criada' })).toBeVisible();
  });
});

test.describe('login', () => {
  test('avisa sobre a senha errada e entra com a correta', async ({ page, request }) => {
    const user = await new ApiHelper(request).signup();
    await page.goto('/login');

    await page.getByLabel('E-mail').fill(user.email);
    await page.getByRole('textbox', { name: 'Senha', exact: true }).fill('SenhaErrada123');
    await page.getByRole('button', { name: 'Entrar', exact: true }).click();
    await expect(page.getByRole('alert')).toHaveText(/E-mail ou senha incorretos/);
    await expect(page).toHaveURL('/login');

    await loginThroughUi(page, user);
    await expect(page).toHaveURL('/');
  });
});
