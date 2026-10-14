import { defineConfig, devices } from '@playwright/test';

import {
  API_PORT,
  API_URL,
  E2E_ADMIN,
  E2E_DATABASE_URL,
  WEB_PORT,
  WEB_URL,
} from './e2e/support/env';

const ci = Boolean(process.env.CI);

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.e2e.ts',
  fullyParallel: true,
  forbidOnly: ci,
  retries: ci ? 1 : 0,
  reporter: ci ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: WEB_URL,
    locale: 'pt-BR',
    timezoneId: 'America/Maceio',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] }, testIgnore: '**/mobile.e2e.ts' },
    { name: 'mobile', use: { ...devices['Pixel 7'] }, testMatch: '**/mobile.e2e.ts' },
  ],
  webServer: [
    {
      // O banco `_e2e` é recriado a cada execução, com o catálogo do seed: cada rodada começa limpa.
      command:
        'uv run python -m scripts.reset_e2e_database && ' +
        `uv run uvicorn app.main:create_app --factory --port ${API_PORT}`,
      cwd: '../backend',
      url: `${API_URL}/health`,
      timeout: 120_000,
      reuseExistingServer: false,
      env: {
        APP_ENV: 'test',
        DATABASE_URL: E2E_DATABASE_URL,
        JWT_SECRET: 'e2e-only-secret-never-used-outside-local-tests',
        ALLOWED_EMAIL_DOMAINS: 'umj.edu.br',
        CORS_ORIGINS: WEB_URL,
        RATE_LIMIT_ENABLED: 'false',
        // Campus sempre aberto e janela de check-in de 1 h: o E2E do check-in (#43) sempre
        // encontra um horário começando em breve, a qualquer hora em que o CI rodar.
        HORARIO_FUNCIONAMENTO: 'seg-dom 00:00-23:30',
        CHECKIN_ANTECEDENCIA_MIN: '60',
        SEED_ADMIN_NOME: E2E_ADMIN.nome,
        SEED_ADMIN_EMAIL: E2E_ADMIN.email,
        SEED_ADMIN_SENHA: E2E_ADMIN.senha,
      },
    },
    {
      command: `npx vite --port ${WEB_PORT} --strictPort --host 127.0.0.1`,
      url: WEB_URL,
      timeout: 60_000,
      reuseExistingServer: false,
      env: { VITE_API_URL: API_URL },
    },
  ],
});
