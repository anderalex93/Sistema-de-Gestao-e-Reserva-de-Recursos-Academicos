// Capturas reais do sistema para a página inicial (#47): grade de horários e comprovante.
//
// Pré-requisitos: API em :8100 com o banco do E2E recém-recriado (as contas abaixo são criadas
// aqui) e o front em :5180 (`VITE_API_URL=http://127.0.0.1:8100/api/v1 npx vite --port 5180`).
// Uso: node scripts/capture-landing.mjs   (grava em src/assets/landing/)
import { chromium } from '@playwright/test';

const API = 'http://127.0.0.1:8100/api/v1';
const WEB = 'http://127.0.0.1:5180';
const OUT = process.argv[2] ?? 'src/assets/landing';

async function api(path, init = {}, token) {
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!response.ok) throw new Error(`${path}: ${response.status} ${await response.text()}`);
  return response.json();
}

async function account(nome, email) {
  const senha = 'Senha123captura';
  await api('/auth/cadastro', {
    method: 'POST',
    body: JSON.stringify({ nome, email, senha, aceite_termos: true }),
  });
  return (await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, senha }) }))
    .access_token;
}

function nextWeekday() {
  const format = (d) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Maceio' }).format(d);
  const day = new Date();
  do day.setUTCDate(day.getUTCDate() + 1);
  while ([0, 6].includes(new Date(`${format(day)}T12:00:00Z`).getUTCDay()));
  return format(day);
}

const lucas = await account('Lucas Andrade', 'lucas.andrade@umj.edu.br');
const maria = await account('Maria Clara Souza', 'maria.souza@umj.edu.br');
const page1 = await api('/recursos?busca=Sala%20de%20estudo%20204&per_page=10', {}, lucas);
const room = page1.items.find((r) => r.bloco.nome === 'Bloco A');
const date = nextWeekday();
const at = (time) => `${date}T${time}:00-03:00`;
await api(
  '/reservas',
  {
    method: 'POST',
    body: JSON.stringify({ recurso_id: room.id, inicio: at('18:30'), fim: at('19:30') }),
  },
  maria,
);
const own = await api(
  '/reservas',
  {
    method: 'POST',
    body: JSON.stringify({
      recurso_id: room.id,
      inicio: at('16:00'),
      fim: at('18:00'),
      finalidade: 'Estudo em grupo de Cálculo II',
      qtd_participantes: 4,
    }),
  },
  lucas,
);

const browser = await chromium.launch();

// Grade: trecho do fim da tarde, com a reserva da própria pessoa, um horário ocupado e uma seleção.
const desk = await browser.newPage({
  viewport: { width: 1280, height: 900 },
  deviceScaleFactor: 2,
});
await desk.addInitScript((t) => localStorage.setItem('eduspace.token', t), lucas);
await desk.goto(`${WEB}/recursos/${room.id}?data=${date}`);
const grid = desk.getByRole('list', { name: 'Horários do dia' });
await grid.getByRole('button', { name: /^19:30 às 20:00, livre$/ }).click();
await grid.getByRole('button', { name: /^20:00 às 20:30, livre$/ }).click();
await desk.mouse.move(0, 0);
const first = await grid.getByRole('button', { name: /^17:00 às 17:30/ }).boundingBox();
const last = await grid.getByRole('button', { name: /^20:30 às 21:00/ }).boundingBox();
await desk.screenshot({
  path: `${OUT}/grade.png`,
  clip: { x: first.x, y: first.y, width: first.width, height: last.y + last.height - first.y },
});

// Comprovante no celular, como a pessoa mostra na entrada.
const phone = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
});
await phone.goto(`${WEB}/comprovantes/${own.codigo}`);
const receipt = phone.getByRole('article', { name: /^Comprovante / });
await receipt.waitFor();
await phone.waitForTimeout(800);
await receipt.screenshot({ path: `${OUT}/comprovante.png` });

console.log(
  JSON.stringify({
    grade: [first.width, last.y + last.height - first.y],
    comprovante: await receipt.boundingBox(),
  }),
);

// Imagem de compartilhamento (#48): o topo da página inicial, com a marca e a grade.
const share = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await share.goto(`${WEB}/`);
await share.getByRole('img', { name: /Grade de horários/ }).waitFor();
await share.waitForTimeout(500);
await share.screenshot({ path: 'public/og-image.png' });
await browser.close();
