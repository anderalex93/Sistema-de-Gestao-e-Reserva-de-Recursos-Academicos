import { expect, test } from '@playwright/test';

import { ApiHelper, type TestUser } from './support/api';
import { startReservationNow } from './support/backend';
import { E2E_ADMIN } from './support/env';
import { loginThroughUi, startSession } from './support/flows';
import { campusDate, nextSlot } from './support/schedule';

// Uma sala por tentativa: retries e --repeat-each reservam o mesmo próximo horário.
const ROOMS = [
  'Sala de estudo 103',
  'Sala de estudo 102',
  'Sala de estudo 202',
  'Sala de estudo 203',
];

// #43: o QR da porta confirma a presença de quem reservou. O ambiente do E2E deixa o campus
// sempre aberto e a janela de check-in abrindo 1 h antes, para haver sempre um horário em breve.
test('confirma presença pelo QR da porta e a lista mostra o check-in', async ({
  page,
  request,
}) => {
  const api = new ApiHelper(request);
  const admin: TestUser = { ...E2E_ADMIN };
  await api.acceptTerms(admin);
  const user = await api.signup();
  const roomName = ROOMS[(test.info().retry + test.info().repeatEachIndex) % ROOMS.length] ?? '';
  const room = await api.resourceByName(user, roomName, 'Bloco A');
  const token = await api.checkinToken(admin, room.id);
  const slot = nextSlot();
  const reservation = await api.reserve(user, room, slot.date, slot.inicio, slot.fim);

  await loginThroughUi(page, user);
  await page.goto(`/checkin/${token}`);
  await expect(page.getByRole('heading', { level: 1, name: roomName })).toBeVisible();
  await expect(page.getByText('Você chegou à sua reserva')).toBeVisible();
  await page.getByRole('button', { name: 'Confirmar presença' }).click();

  await expect(page.getByText('Presença confirmada')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Ver comprovante' })).toHaveAttribute(
    'href',
    `/comprovantes/${reservation.codigo}`,
  );

  // Ler o QR de novo não repete o check-in: mostra a presença já registrada.
  await page.reload();
  await expect(page.getByText('Presença confirmada')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Confirmar presença' })).toHaveCount(0);

  await page.goto('/minhas-reservas');
  await expect(
    page.getByRole('list', { name: 'Próximas reservas' }).getByText(/^Presença confirmada às/),
  ).toBeVisible();
});

test('QR antigo ou inventado não confirma nada', async ({ page, request }) => {
  const user = await new ApiHelper(request).signup();
  await loginThroughUi(page, user);

  await page.goto('/checkin/qr-que-nao-existe');

  await expect(
    page.getByRole('heading', { level: 1, name: 'QR Code não reconhecido' }),
  ).toBeVisible();
});

test('a administração imprime o QR da porta e acompanha a ocupação', async ({ page, request }) => {
  const api = new ApiHelper(request);
  const admin: TestUser = { ...E2E_ADMIN };
  await api.acceptTerms(admin);
  const room = await api.resourceByName(admin, 'Sala de estudo 104', 'Bloco A');
  const token = await api.checkinToken(admin, room.id);
  await startSession(page, await api.token(admin));

  await page.goto('/admin/recursos');
  await page.getByRole('link', { name: 'QR da porta de Sala de estudo 104' }).first().click();
  const poster = page.getByRole('region', { name: 'Cartaz de check-in de Sala de estudo 104' });
  await expect(poster).toBeVisible();
  await expect(poster.getByText(new RegExp(`/checkin/${token}$`))).toBeVisible();

  await page.goto('/admin/ocupacao');
  await expect(page.getByRole('heading', { level: 1, name: 'Ocupação' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Resumo' })).toBeVisible();
  await expect(page.getByRole('table', { name: /Parte do tempo disponível/ })).toBeVisible();
});

// Salas só deste teste, uma por tentativa: o horário é movido para agora direto no banco.
const EARLY_END_ROOMS = [
  'Sala de estudo 301',
  'Sala de estudo 302',
  'Sala de estudo 303',
  'Sala de estudo 304',
];

function plusHalfHour(time: string): string {
  const [hours = 0, minutes = 0] = time.split(':').map(Number);
  const total = hours * 60 + minutes + 30;
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

test('encerra o uso pelo QR da porta e a grade mostra o resto do horário livre', async ({
  page,
  request,
}) => {
  const api = new ApiHelper(request);
  const admin: TestUser = { ...E2E_ADMIN };
  await api.acceptTerms(admin);
  const user = await api.signup();
  const attempt = test.info().retry + test.info().repeatEachIndex;
  const roomName = EARLY_END_ROOMS[attempt % EARLY_END_ROOMS.length] ?? '';
  const room = await api.resourceByName(user, roomName, 'Bloco D');
  const token = await api.checkinToken(admin, room.id);
  const slot = nextSlot();
  const reservation = await api.reserve(user, room, slot.date, slot.inicio, slot.fim);

  await loginThroughUi(page, user);
  await page.goto(`/checkin/${token}`);
  await page.getByRole('button', { name: 'Confirmar presença' }).click();
  await expect(page.getByText('Presença confirmada')).toBeVisible();

  // A reserva começa agora: ao sair, a pessoa lê o QR de novo e encerra o uso.
  startReservationNow(reservation.codigo);
  await page.reload();
  await page.getByRole('button', { name: 'Encerrar uso e liberar a sala' }).click();
  const dialog = page.getByRole('dialog', { name: 'Encerrar o uso agora?' });
  const notice = await dialog.getByText(/^A sala fica livre a partir das \d\d:\d\d\.$/).innerText();
  const freeAt = /(\d\d:\d\d)/.exec(notice)?.[1] ?? '';
  await dialog.getByRole('button', { name: 'Sim, encerrar' }).click();

  await expect(page.getByText('Uso encerrado', { exact: true })).toBeVisible();
  await expect(
    page.getByText(`A sala ficou livre a partir das ${freeAt}. Obrigado por liberar o espaço.`),
  ).toBeVisible();

  await page.goto(`/recursos/${room.id}?data=${campusDate(new Date())}`);
  const grid = page.getByRole('list', { name: 'Horários do dia' });
  await expect(
    grid.getByRole('button', { name: `${freeAt} às ${plusHalfHour(freeAt)}, livre` }),
  ).toBeEnabled();

  await page.goto('/minhas-reservas');
  await expect(page.getByText(/^Uso encerrado às \d\d:\d\d$/).first()).toBeVisible();
});
