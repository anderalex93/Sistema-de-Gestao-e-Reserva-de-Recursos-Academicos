// Portas próprias: o E2E roda ao lado do `make dev` (8000) e do `npm run dev` (5173).
export const API_PORT = 8100;
export const WEB_PORT = 5180;

// O vídeo da demo (`npm run demo:video`) pode rodar contra outro ambiente, como a produção ou o
// `docker compose up`: DEMO_BASE_URL e DEMO_API_URL apontam para ele.
export const API_URL = process.env.DEMO_API_URL ?? `http://127.0.0.1:${API_PORT}/api/v1`;
export const WEB_URL = process.env.DEMO_BASE_URL ?? `http://127.0.0.1:${WEB_PORT}`;

/** Admin criado pelo seed do banco `_e2e` (credencial só de teste). */
export const E2E_ADMIN = {
  nome: 'Administração E2E',
  email: 'admin.e2e@umj.edu.br',
  senha: 'AdminE2e2026',
} as const;

/** Pasta do vídeo da demo; definida só pela config `playwright.demo.config.ts`. */
export const DEMO_VIDEO_DIR = process.env.DEMO_VIDEO_DIR;
