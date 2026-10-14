import { defineConfig } from '@playwright/test';

import base from './playwright.config';

// Vídeo da demo para o plano B (#38): o roteiro de e2e/demo.e2e.ts, devagar, com cada navegador
// gravado em demo-video/. Sem DEMO_BASE_URL, sobe o mesmo ambiente local do E2E; com ele (e
// DEMO_API_URL e DEMO_SENHA), grava contra a produção ou o `docker compose up`.
process.env.DEMO_VIDEO_DIR ??= 'demo-video';
const external = Boolean(process.env.DEMO_BASE_URL);

export default defineConfig({
  ...base,
  testMatch: '**/demo.e2e.ts',
  retries: 0,
  reporter: [['list']],
  outputDir: 'demo-video/test-results',
  projects: [
    {
      name: 'demo',
      use: {
        ...base.use,
        ...(external ? { baseURL: process.env.DEMO_BASE_URL } : {}),
        // Ritmo de quem apresenta: cada ação espera o suficiente para ser vista no vídeo.
        launchOptions: { slowMo: 450 },
      },
    },
  ],
  ...(external ? { webServer: undefined } : {}),
});
