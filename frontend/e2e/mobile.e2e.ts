import { expect, test } from '@playwright/test';

import { ApiHelper } from './support/api';
import { expectNoHorizontalScroll, loginThroughUi, selectSlots } from './support/flows';
import { testDay } from './support/schedule';

// Persona do relatório: reserva pelo celular, antes da aula (RNF01).
test('reserva e cancela pelo celular, sem rolagem horizontal', async ({ page, request }) => {
  const user = await new ApiHelper(request).signup();
  const date = testDay(test.info());
  await loginThroughUi(page, user);
  await expectNoHorizontalScroll(page);

  await page
    .getByRole('navigation', { name: 'Navegação inferior' })
    .getByRole('link', { name: 'Reservar' })
    .click();
  await page.getByRole('button', { name: 'Filtrar' }).click();
  const filters = page.getByRole('dialog', { name: 'Filtros' });
  await filters.getByRole('combobox', { name: 'Tipo' }).click();
  await page.getByRole('option', { name: 'Sala de estudo' }).click();
  const projector = filters.getByRole('button', { name: 'Projetor' });
  await projector.click();
  await expect(projector).toHaveAttribute('aria-pressed', 'true');
  await filters.getByLabel('Data').fill(date);
  await filters.getByRole('button', { name: 'Ver 3 resultados' }).click();
  await expect(filters).toBeHidden();
  await expectNoHorizontalScroll(page);

  const card = page.getByRole('list', { name: 'Recursos' }).getByRole('link', {
    name: /Sala de estudo 202/,
  });
  await expect(card).toHaveAttribute('href', new RegExp(`data=${date}`));
  await card.click();
  await selectSlots(page, '16:00', '17:30');
  const bar = page.getByRole('region', { name: 'Horário escolhido' });
  await expect(bar).toContainText('16:00 às 18:00 · 2h');
  await expectNoHorizontalScroll(page);
  await bar.getByRole('button', { name: 'Reservar este horário' }).click();

  const dialog = page.getByRole('dialog', { name: 'Confirmar reserva?' });
  await dialog.getByRole('button', { name: 'Confirmar reserva' }).click();
  await expect(page.getByRole('heading', { level: 1, name: /^Comprovante EDU-/ })).toBeVisible();
  await expectNoHorizontalScroll(page);

  await page.goto('/minhas-reservas');
  const upcoming = page.getByRole('list', { name: 'Próximas reservas' });
  await expect(upcoming).toContainText('Sala de estudo 202');
  await expectNoHorizontalScroll(page);
  await upcoming.getByRole('button', { name: 'Cancelar' }).click();
  await page
    .getByRole('dialog', { name: 'Deseja cancelar esta reserva?' })
    .getByRole('button', { name: 'Sim, cancelar' })
    .click();
  await expect(page.getByText('Você não tem reservas marcadas.')).toBeVisible();
});
