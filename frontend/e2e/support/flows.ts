import { expect, type Page } from '@playwright/test';

import type { TestUser } from './api';

export async function loginThroughUi(page: Page, user: TestUser): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('E-mail').fill(user.email);
  await page.getByRole('textbox', { name: 'Senha', exact: true }).fill(user.senha);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Início' })).toBeVisible();
}

/** Clica no bloco de início e no bloco de fim, como a pessoa faz na grade. */
export async function selectSlots(page: Page, first: string, last: string): Promise<void> {
  const grid = page.getByRole('list', { name: 'Horários do dia' });
  await grid.getByRole('button', { name: new RegExp(`^${first} às .*, livre$`) }).click();
  await grid.getByRole('button', { name: new RegExp(`^${last} às .*, livre$`) }).click();
}

/** RNF01: nada de rolagem horizontal, em nenhum tamanho de tela. */
export async function expectNoHorizontalScroll(page: Page): Promise<void> {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow, 'a página rola na horizontal').toBeLessThanOrEqual(0);
}
