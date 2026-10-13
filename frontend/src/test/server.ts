import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

import { config } from '@/config';

export const API_URL = 'http://api.test/api/v1';

/**
 * Respostas padrão que sobrevivem ao `resetHandlers`: uma conta sem reservas.
 * O início chama `/reservas/minhas` em toda tela logada que abre em `/`.
 */
const defaults = [
  http.get(`${config.apiUrl}/reservas/minhas`, () =>
    HttpResponse.json({ items: [], total: 0, page: 1, per_page: 10, total_pages: 0 }),
  ),
];

/** Servidor MSW compartilhado. Cada teste registra seus handlers com `server.use(...)`. */
export const server = setupServer(...defaults);
