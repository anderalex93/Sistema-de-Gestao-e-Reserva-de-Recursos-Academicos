import { expect, type Page } from '@playwright/test';

import type { TestUser } from './api';

export async function loginThroughUi(page: Page, user: TestUser): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('E-mail').fill(user.email);
  await page.getByRole('textbox', { name: 'Senha', exact: true }).fill(user.senha);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Início' })).toBeVisible();
}

/**
 * Clica no bloco de início e no bloco de fim, como a pessoa faz na grade. Para um bloco só,
 * um clique: o segundo no mesmo bloco desfaria a seleção.
 */
export async function selectSlots(page: Page, first: string, last: string): Promise<void> {
  const grid = page.getByRole('list', { name: 'Horários do dia' });
  await grid.getByRole('button', { name: new RegExp(`^${first} às .*, livre$`) }).click();
  if (last === first) return;
  await grid.getByRole('button', { name: new RegExp(`^${last} às .*, livre$`) }).click();
}

/** RNF01: nada de rolagem horizontal, em nenhum tamanho de tela. */
export async function expectNoHorizontalScroll(page: Page): Promise<void> {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow, 'a página rola na horizontal').toBeLessThanOrEqual(0);
}

/** Abre a sessão direto com o token, como o app faz depois do login. */
export async function startSession(page: Page, token: string): Promise<void> {
  await page.addInitScript((value) => {
    window.localStorage.setItem('eduspace.token', value);
  }, token);
}

/** Espera a página sair do carregamento: nenhum skeleton nem região ocupada. */
export async function waitUntilLoaded(page: Page): Promise<void> {
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('.MuiSkeleton-root')).toHaveCount(0);
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
}
