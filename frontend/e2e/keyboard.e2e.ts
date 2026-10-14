import { expect, test, type Locator, type Page } from '@playwright/test';

import { ApiHelper } from './support/api';
import { testDay } from './support/schedule';

const MAX_TABS = 80;

/** Chega ao elemento só com Tab, como quem não usa mouse, e confere o anel de foco. */
async function tabTo(page: Page, target: Locator): Promise<void> {
  for (let presses = 0; presses < MAX_TABS; presses += 1) {
    await page.keyboard.press('Tab');
    if (await target.evaluate((element) => element === document.activeElement)) {
      // Anel de foco nos controles; nos campos, a borda de 2px do contorno (`.Mui-focused`).
      const visible = await target.evaluate(
        (element) =>
          getComputedStyle(element).outlineStyle !== 'none' ||
          element.closest('.Mui-focused') !== null,
      );
      expect(visible, 'foco sem indicação visível').toBe(true);
      return;
    }
  }
  throw new Error(`Elemento fora do alcance do Tab: ${target.toString()}`);
}

// RNF01 / #32: o fluxo principal inteiro sem mouse.
test('reserva, confere e cancela usando só o teclado', async ({ page, request }) => {
  const api = new ApiHelper(request);
  const user = await api.signup();
  const room = await api.resourceByName(user, 'Sala de estudo 104', 'Bloco A');
  const date = testDay(test.info());

  await page.goto('/login');
  await tabTo(page, page.getByLabel('E-mail'));
  await page.keyboard.type(user.email);
  await tabTo(page, page.getByRole('textbox', { name: 'Senha', exact: true }));
  await page.keyboard.type(user.senha);
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { level: 1, name: 'Início' })).toBeVisible();

  await page.goto(`/recursos/${room.id}?data=${date}`);
  const grid = page.getByRole('list', { name: 'Horários do dia' });
  await tabTo(page, grid.getByRole('button', { name: '11:00 às 11:30, livre' }));
  await page.keyboard.press('Space');
  await tabTo(page, grid.getByRole('button', { name: '11:30 às 12:00, livre' }));
  await page.keyboard.press('Enter');

  const reserve = page.getByRole('button', { name: 'Reservar este horário' });
  await tabTo(page, reserve);
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', { name: 'Confirmar reserva?' });
  await expect(dialog.getByRole('button', { name: 'Voltar' })).toBeFocused();

  // Esc fecha sem reservar e devolve o foco para quem abriu o diálogo.
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(reserve).toBeFocused();

  await page.keyboard.press('Enter');
  await expect(dialog.getByRole('button', { name: 'Voltar' })).toBeFocused();
  await tabTo(page, dialog.getByRole('button', { name: 'Confirmar reserva' }));
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { level: 1, name: /^Comprovante EDU-/ })).toBeVisible();

  await page.goto('/minhas-reservas');
  const upcoming = page.getByRole('list', { name: 'Próximas reservas' });
  await expect(upcoming).toContainText('Sala de estudo 104');
  await tabTo(page, upcoming.getByRole('button', { name: 'Cancelar' }));
  await page.keyboard.press('Enter');
  const cancel = page.getByRole('dialog', { name: 'Deseja cancelar esta reserva?' });
  await expect(cancel.getByRole('button', { name: 'Manter reserva' })).toBeFocused();
  await tabTo(page, cancel.getByRole('button', { name: 'Sim, cancelar' }));
  await page.keyboard.press('Enter');
  await expect(page.getByText('Você não tem reservas marcadas.')).toBeVisible();
});
