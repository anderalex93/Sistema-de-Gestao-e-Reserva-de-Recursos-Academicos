import { expect, test } from '@playwright/test';

// #47: o caminho para entrar aparece sem rolar, no celular pequeno e no notebook.
for (const viewport of [
  { width: 360, height: 800 },
  { width: 1280, height: 800 },
]) {
  test(`CTA de entrada visível sem rolar em ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');

    const cta = page.getByRole('link', { name: 'Entrar com e-mail institucional' }).first();
    await expect(cta).toBeInViewport();
    await cta.click();
    await expect(page.getByRole('heading', { level: 1, name: 'Entrar' })).toBeVisible();
  });
}

test('páginas públicas ligadas pelo rodapé', async ({ page }) => {
  await page.goto('/');
  const footer = page.getByRole('navigation', { name: 'Rodapé' });

  await footer.getByRole('link', { name: 'Sobre' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Sobre o EduSpace' })).toBeVisible();
  await footer.getByRole('link', { name: 'Ajuda' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Ajuda' })).toBeVisible();
  await footer.getByRole('link', { name: 'Termos de Uso' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Termos de Uso' })).toBeVisible();
  await footer.getByRole('link', { name: 'Aviso de Privacidade' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Aviso de Privacidade' })).toBeVisible();
  await page.getByRole('link', { name: 'EduSpace' }).click();
  await expect(page).toHaveURL('/');
});
