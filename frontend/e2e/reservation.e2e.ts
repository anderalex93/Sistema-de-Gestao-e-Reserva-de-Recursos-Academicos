import { expect, test } from '@playwright/test';

import { ApiHelper } from './support/api';
import { loginThroughUi, selectSlots } from './support/flows';
import { testDay } from './support/schedule';

test('busca sala com projetor, reserva pela grade e recebe o comprovante', async ({
  page,
  request,
}) => {
  const user = await new ApiHelper(request).signup();
  const date = testDay(test.info());
  await loginThroughUi(page, user);

  await page
    .getByRole('navigation', { name: 'Navegação principal' })
    .getByRole('link', { name: 'Reservar' })
    .click();
  await expect(page.getByRole('heading', { level: 1, name: 'Reservar espaço' })).toBeVisible();

  const filters = page.getByRole('region', { name: 'Filtros' });
  await filters.getByRole('combobox', { name: 'Tipo' }).click();
  await page.getByRole('option', { name: 'Sala de estudo' }).click();
  const projector = filters.getByRole('button', { name: 'Projetor' });
  await projector.click();
  await expect(projector).toHaveAttribute('aria-pressed', 'true');
  await filters.getByLabel('Data').fill(date);
  await expect(page.getByText(/^3 recursos$/)).toBeVisible();

  // O total não muda com a data (todas livres): espera o card já apontar para o dia escolhido.
  const card = page.getByRole('list', { name: 'Recursos' }).getByRole('link', {
    name: /Sala de estudo 201/,
  });
  await expect(card).toHaveAttribute('href', new RegExp(`data=${date}`));
  await card.click();
  await expect(page.getByRole('heading', { level: 1, name: 'Sala de estudo 201' })).toBeVisible();

  await selectSlots(page, '09:00', '09:30');
  await expect(page.getByText('09:00 às 10:00 · 1h')).toBeVisible();
  await page.getByRole('button', { name: 'Reservar este horário' }).click();

  const dialog = page.getByRole('dialog', { name: 'Confirmar reserva?' });
  await expect(dialog).toContainText('Sala de estudo 201 (Sala de estudo)');
  await expect(dialog).toContainText('09:00 às 10:00');
  await expect(dialog.getByRole('button', { name: 'Voltar' })).toBeFocused();
  await dialog.getByLabel('Finalidade (opcional)').fill('Estudo para a prova de cálculo');
  await dialog.getByRole('button', { name: 'Confirmar reserva' }).click();

  await expect(page).toHaveURL(/\/comprovantes\/EDU-[A-Z0-9]+$/);
  await expect(page.getByRole('heading', { level: 1, name: /^Comprovante EDU-/ })).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: 'Reserva confirmada.' })).toBeVisible();
  const receipt = page.getByRole('article', { name: /^Comprovante EDU-/ });
  await expect(receipt).toContainText('Sala de estudo 201');
  await expect(receipt).toContainText('09:00 às 10:00');
});

test('avisa quando o horário é tomado antes da confirmação e atualiza a grade', async ({
  page,
  request,
}) => {
  const api = new ApiHelper(request);
  const [user, rival] = await Promise.all([api.signup(), api.signup()]);
  const room = await api.resourceByName(user, 'Sala de estudo 203', 'Bloco B');
  const date = testDay(test.info());
  await loginThroughUi(page, user);

  await page.goto(`/recursos/${room.id}?data=${date}`);
  await selectSlots(page, '10:00', '10:30');
  await page.getByRole('button', { name: 'Reservar este horário' }).click();
  const dialog = page.getByRole('dialog', { name: 'Confirmar reserva?' });
  await expect(dialog).toBeVisible();

  // Outra pessoa confirma parte do mesmo horário enquanto o resumo está aberto.
  await api.reserve(rival, room, date, '10:30', '11:00');
  await dialog.getByRole('button', { name: 'Confirmar reserva' }).click();

  await expect(page.getByRole('alert')).toHaveText(
    'Este horário acabou de ser reservado por outra pessoa. Escolha outro horário na grade.',
  );
  await expect(dialog).toBeHidden();
  const grid = page.getByRole('list', { name: 'Horários do dia' });
  await expect(grid.getByRole('button', { name: /^10:30 às 11:00, ocupado/ })).toBeDisabled();
  await expect(grid.getByRole('button', { name: '10:00 às 10:30, livre' })).toHaveAttribute(
    'aria-pressed',
    'false',
  );
});

test('cancela em Minhas reservas e o horário volta a ficar livre', async ({ page, request }) => {
  const api = new ApiHelper(request);
  const user = await api.signup();
  const lab = await api.resourceByName(user, 'Laboratório de Informática 1', 'Bloco C');
  const date = testDay(test.info());
  const reservation = await api.reserve(user, lab, date, '14:00', '15:00');
  await loginThroughUi(page, user);

  await page
    .getByRole('navigation', { name: 'Navegação principal' })
    .getByRole('link', { name: 'Minhas reservas' })
    .click();
  const upcoming = page.getByRole('list', { name: 'Próximas reservas' });
  await expect(upcoming).toContainText('Laboratório de Informática 1');
  await upcoming.getByRole('button', { name: 'Cancelar' }).click();

  const dialog = page.getByRole('dialog', { name: 'Deseja cancelar esta reserva?' });
  await expect(dialog).toContainText(reservation.codigo);
  await expect(dialog.getByRole('button', { name: 'Manter reserva' })).toBeFocused();
  await dialog.getByRole('button', { name: 'Sim, cancelar' }).click();

  await expect(
    page
      .getByRole('status')
      .filter({ hasText: 'Reserva cancelada. O horário ficou livre de novo.' }),
  ).toBeVisible();
  await expect(dialog).toBeHidden();
  await expect(page.getByText('Você não tem reservas marcadas.')).toBeVisible();

  await page.goto(`/recursos/${lab.id}?data=${date}`);
  const grid = page.getByRole('list', { name: 'Horários do dia' });
  await expect(grid.getByRole('button', { name: '14:00 às 14:30, livre' })).toBeEnabled();
  await expect(grid.getByRole('button', { name: '14:30 às 15:00, livre' })).toBeEnabled();
});
