// Lighthouse mobile nas telas de login, busca e grade (#32), com sessão aberta nas privadas.
//
// Pré-requisitos: API no ar (LH_API_URL) e o build de produção servido (LH_BASE_URL), por
// exemplo `npm run build && npx vite preview --port 4173`. Relatórios e summary.json em
// lighthouse-reports/ (ou LH_OUT_DIR).
// Uso: node scripts/lighthouse.mjs
import { execFileSync, spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

import { chromium } from '@playwright/test';

const BASE_URL = process.env.LH_BASE_URL ?? 'http://127.0.0.1:4173';
const API_URL = process.env.LH_API_URL ?? 'http://127.0.0.1:8100/api/v1';
const LIGHTHOUSE = 'lighthouse@13.5.0';
const PORT = 9333;
const DEBUGGER_URL = `http://127.0.0.1:${PORT}`;
const OUT_DIR = process.env.LH_OUT_DIR ?? 'lighthouse-reports';
const CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo'];

async function api(path, init = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init.headers },
  });
  if (!response.ok) throw new Error(`${path}: ${response.status} ${await response.text()}`);
  return response.json();
}

function nextWeekday() {
  const day = new Date();
  const format = (date) =>
    new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Maceio' }).format(date);
  do day.setUTCDate(day.getUTCDate() + 1);
  while ([0, 6].includes(new Date(`${format(day)}T12:00:00Z`).getUTCDay()));
  return format(day);
}

async function waitForDebugger(attempts = 50) {
  try {
    await fetch(`${DEBUGGER_URL}/json/version`);
  } catch (error) {
    if (attempts === 0) throw error;
    await sleep(200);
    await waitForDebugger(attempts - 1);
  }
}

/**
 * Cache HTTP vazio antes de cada tela: toda medição é de primeira visita. Com
 * --disable-storage-reset o Lighthouse não limparia nada, nem o localStorage da sessão.
 */
async function clearHttpCache() {
  const browser = await chromium.connectOverCDP(DEBUGGER_URL);
  const [context] = browser.contexts();
  const page = await context.newPage();
  const session = await context.newCDPSession(page);
  await session.send('Network.clearBrowserCache');
  await page.close();
  await browser.close();
}

async function audit(name, url) {
  await clearHttpCache();
  const output = `${OUT_DIR}/${name}`;
  execFileSync(
    'npx',
    [
      '--yes',
      LIGHTHOUSE,
      url,
      `--port=${PORT}`,
      '--disable-storage-reset',
      `--only-categories=${CATEGORIES.join(',')}`,
      '--output=json',
      '--output=html',
      `--output-path=${output}`,
      '--quiet',
    ],
    { stdio: 'inherit', shell: process.platform === 'win32' },
  );
  const report = JSON.parse(readFileSync(`${output}.report.json`, 'utf8'));
  const scores = Object.fromEntries(
    CATEGORIES.map((category) => [category, Math.round(report.categories[category].score * 100)]),
  );
  return {
    tela: name,
    ...scores,
    lcp: report.audits['largest-contentful-paint'].displayValue,
    tbt: report.audits['total-blocking-time'].displayValue,
    cls: report.audits['cumulative-layout-shift'].displayValue,
  };
}

mkdirSync(OUT_DIR, { recursive: true });
const user = {
  nome: 'Pessoa Lighthouse',
  email: `lighthouse.${randomUUID().slice(0, 8)}@umj.edu.br`,
  senha: 'Senha123lh',
};
await api('/auth/cadastro', {
  method: 'POST',
  body: JSON.stringify({ ...user, aceite_termos: true }),
});
const { access_token: token } = await api('/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email: user.email, senha: user.senha }),
});
const resources = await api('/recursos?busca=Sala%20de%20estudo%20201&per_page=1', {
  headers: { Authorization: `Bearer ${token}` },
});
const resource = resources.items[0];

// Chromium à parte: se o Playwright controlasse o navegador, seguraria as abas que o
// Lighthouse abre. O Playwright só entra por CDP para gravar o token e sai em seguida.
const chrome = spawn(
  chromium.executablePath(),
  [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${mkdtempSync(join(tmpdir(), 'eduspace-lighthouse-'))}`,
    '--no-first-run',
    'about:blank',
  ],
  { stdio: 'ignore' },
);
try {
  await waitForDebugger();
  const results = [await audit('login', `${BASE_URL}/login`)];

  // As telas privadas leem o token do localStorage, que o Lighthouse mantém com
  // --disable-storage-reset.
  const cdp = await chromium.connectOverCDP(DEBUGGER_URL);
  const [context] = cdp.contexts();
  const page = await context.newPage();
  await page.goto(`${BASE_URL}/login`);
  await page.evaluate((value) => window.localStorage.setItem('eduspace.token', value), token);
  await page.close();
  await cdp.close();

  results.push(await audit('busca', `${BASE_URL}/reservar`));
  results.push(await audit('grade', `${BASE_URL}/recursos/${resource.id}?data=${nextWeekday()}`));
  console.table(results);
  writeFileSync(`${OUT_DIR}/summary.json`, JSON.stringify(results, null, 2));
} finally {
  chrome.kill();
}
