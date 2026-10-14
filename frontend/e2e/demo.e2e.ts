import { expect, test, type Browser, type Page } from '@playwright/test';

import { ApiHelper, newUser, type TestUser } from './support/api';
import { DEMO_VIDEO_DIR, E2E_ADMIN } from './support/env';
import { loginThroughUi, selectSlots, startSession } from './support/flows';
import { nextSlot, testDay } from './support/schedule';

/**
 * O roteiro da apresentação (docs/apresentacao/roteiro.md), de ponta a ponta, com dois
 * navegadores: se este teste passa, a demo funciona. `npm run demo:video` grava o mesmo roteiro.
 *
 * Com DEMO_SENHA definida, usa as contas do seed de demonstração (aluno.demo, prof.demo,
 * admin.demo); sem ela, cria pessoas novas pela API (CI e E2E local).
 */
const ROOM = { nome: 'Sala de estudo 203', bloco: 'Bloco B' };
const demoPassword = process.env.DEMO_SENHA;

function demoAccount(local: string, nome: string): TestUser {
  return { nome, email: `${local}@umj.edu.br`, senha: demoPassword ?? '' };
}

async function accounts(api: ApiHelper) {
  if (demoPassword) {
    return {
      student: demoAccount('aluno.demo', 'Lucas Andrade'),
      teacher: demoAccount('prof.demo', 'Marina Lopes'),
      admin: demoAccount('admin.demo', 'Administração Demo'),
    };
  }
  const admin: TestUser = { ...E2E_ADMIN };
  await api.acceptTerms(admin);
  const [student, teacher] = await Promise.all([
    api.signup({ ...newUser(), nome: 'Lucas Andrade E2E' }),
    api.signup({ ...newUser(), nome: 'Marina Lopes E2E' }),
  ]);
  return { student, teacher, admin };
}

const windows: { page: Page; name: string }[] = [];

/** Cada pessoa num navegador próprio; no vídeo da demo, cada um vira um arquivo com o nome dela. */
async function openWindow(browser: Browser, name: string): Promise<Page> {
  const context = await browser.newContext({
    locale: 'pt-BR',
    timezoneId: 'America/Maceio',
    viewport: { width: 1280, height: 720 },
    ...(DEMO_VIDEO_DIR
      ? { recordVideo: { dir: DEMO_VIDEO_DIR, size: { width: 1280, height: 720 } } }
      : {}),
  });
  const page = await context.newPage();
  windows.push({ page, name });
  return page;
}

// O vídeo só é gravado por inteiro quando o navegador fecha; então ganha um nome legível.
test.afterEach(async () => {
  for (const { page, name } of windows.splice(0)) {
    const video = page.video();
    await page.context().close();
    if (video && DEMO_VIDEO_DIR) {
      await video.saveAs(`${DEMO_VIDEO_DIR}/${name}.webm`);
      await video.delete();
    }
  }
});

test('roteiro da apresentação: reserva, conflito, check-in, cancelamento e administração', async ({
  browser,
  request,
}) => {
  test.setTimeout(120_000);
  const api = new ApiHelper(request);
  const { student, teacher, admin } = await accounts(api);
  const room = await api.resourceByName(student, ROOM.nome, ROOM.bloco);
  const slot = nextSlot();
  // O cancelamento ao vivo é de uma reserva mais adiante (RF04: até 30 min antes do início).
  const later = demoPassword
    ? null
    : await api.reserve(student, room, testDay(test.info()), '15:00', '16:00');

  const lucas = await openWindow(browser, '1-aluno-lucas');
  const marina = await openWindow(browser, '2-professora-marina');
  await loginThroughUi(lucas, student);
  await loginThroughUi(marina, teacher);

  // 1. Busca: sala de estudo com projetor, no próximo horário.
  await lucas
    .getByRole('navigation', { name: 'Navegação principal' })
    .getByRole('link', { name: 'Reservar' })
    .click();
  const filters = lucas.getByRole('region', { name: 'Filtros' });
  await filters.getByRole('combobox', { name: 'Tipo' }).click();
  await lucas.getByRole('option', { name: 'Sala de estudo' }).click();
  const projector = filters.getByRole('button', { name: 'Projetor' });
  await projector.click();
  await expect(projector).toHaveAttribute('aria-pressed', 'true');
  await filters.getByLabel('Data').fill(slot.date);
  const card = lucas
    .getByRole('list', { name: 'Recursos' })
    .getByRole('link', { name: new RegExp(ROOM.nome) });
  await expect(card).toHaveAttribute('href', new RegExp(`data=${slot.date}`));
  await card.click();

  // 2. A professora abre o mesmo horário e chega ao resumo antes do aluno confirmar.
  await marina.goto(`/recursos/${room.id}?data=${slot.date}`);
  await selectSlots(marina, slot.inicio, slot.inicio);
  await marina.getByRole('button', { name: 'Reservar este horário' }).click();
  const marinaDialog = marina.getByRole('dialog', { name: 'Confirmar reserva?' });
  await expect(marinaDialog).toBeVisible();

  // 3. Grade, resumo e comprovante.
  await selectSlots(lucas, slot.inicio, slot.inicio);
  await lucas.getByRole('button', { name: 'Reservar este horário' }).click();
  await lucas
    .getByRole('dialog', { name: 'Confirmar reserva?' })
    .getByRole('button', { name: 'Confirmar reserva' })
    .click();
  await expect(lucas.getByRole('heading', { level: 1, name: /^Comprovante EDU-/ })).toBeVisible();
  await expect(
    lucas
      .getByRole('article', { name: /^Comprovante EDU-/ })
      .locator('svg')
      .first(),
  ).toBeVisible();

  // 4. RNF03 ao vivo: a professora confirma o mesmo horário e é avisada.
  await marinaDialog.getByRole('button', { name: 'Confirmar reserva' }).click();
  await expect(marina.getByRole('alert')).toHaveText(/acabou de ser reservado por outra pessoa/);

  // 5. Check-in pelo QR da porta da sala.
  const token = await api.checkinToken(admin, room.id);
  await lucas.goto(`/checkin/${token}`);
  await lucas.getByRole('button', { name: 'Confirmar presença' }).click();
  await expect(lucas.getByText('Presença confirmada')).toBeVisible();

  // 6. Cancelamento: o horário volta a ficar livre na grade aberta da professora, sem recarregar.
  if (later) {
    const day = testDay(test.info());
    await marina.goto(`/recursos/${room.id}?data=${day}`);
    const busy = marina.getByRole('button', { name: /^15:00 às 15:30, ocupado/ });
    await expect(busy).toBeDisabled();
    await lucas.goto('/minhas-reservas');
    const row = lucas
      .getByRole('list', { name: 'Próximas reservas' })
      .getByRole('listitem')
      .filter({ hasText: '15:00 às 16:00' });
    await row.getByRole('button', { name: 'Cancelar' }).click();
    await lucas
      .getByRole('dialog', { name: 'Deseja cancelar esta reserva?' })
      .getByRole('button', { name: 'Sim, cancelar' })
      .click();
    await expect(marina.getByRole('button', { name: '15:00 às 15:30, livre' })).toBeEnabled({
      timeout: 20_000,
    });
  }

  // 7. Administração: sala nova aparece na busca; painel de ocupação.
  const adminPage = await openWindow(browser, '3-administracao');
  await startSession(adminPage, await api.token(admin));
  const newRoom = `Sala da demo ${Date.now().toString(36).slice(-4).toUpperCase()}`;
  await adminPage.goto('/admin/recursos');
  await adminPage.getByRole('button', { name: 'Novo recurso' }).click();
  const form = adminPage.getByRole('dialog', { name: 'Novo recurso' });
  await form.getByRole('combobox', { name: 'Bloco' }).click();
  await adminPage.getByRole('option', { name: 'Bloco B' }).click();
  await form.getByLabel(/^Nome/).fill(newRoom);
  await form.getByLabel(/^Capacidade/).fill('8');
  await form.getByRole('button', { name: 'Projetor' }).click();
  await form.getByRole('button', { name: 'Criar recurso' }).click();
  await expect(form).toBeHidden();

  await lucas.goto(`/reservar?busca=${encodeURIComponent(newRoom)}`);
  await expect(
    lucas.getByRole('list', { name: 'Recursos' }).getByRole('link', { name: new RegExp(newRoom) }),
  ).toBeVisible();

  await adminPage.goto('/admin/ocupacao');
  await expect(adminPage.getByRole('region', { name: 'Resumo' })).toBeVisible();
});
