import { delay, http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/lib/api/api-error';
import { HealthApi } from '@/lib/api/health.api';
import { HttpClient } from '@/lib/api/http-client';
import { MemoryTokenStore } from '@/lib/api/token-store';
import { API_URL, server } from '@/test/server';

let tokenStore: MemoryTokenStore;
let client: HttpClient;

beforeEach(() => {
  tokenStore = new MemoryTokenStore();
  client = new HttpClient({ baseURL: API_URL, tokenStore });
});

async function captureError(promise: Promise<unknown>): Promise<ApiError> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof ApiError) return error;
    throw error;
  }
  throw new Error('A chamada deveria ter falhado.');
}

describe('HttpClient', () => {
  it('returns typed data through a domain API class', async () => {
    server.use(http.get(`${API_URL}/health`, () => HttpResponse.json({ status: 'ok', db: 'ok' })));

    await expect(new HealthApi(client).check()).resolves.toEqual({ status: 'ok', db: 'ok' });
  });

  it('sends the bearer token when there is a session', async () => {
    tokenStore.set('token-abc');
    let authorization: string | null = null;
    server.use(
      http.get(`${API_URL}/health`, ({ request }) => {
        authorization = request.headers.get('Authorization');
        return HttpResponse.json({});
      }),
    );

    await client.get('/health');

    expect(authorization).toBe('Bearer token-abc');
  });

  it('omits the Authorization header without a session', async () => {
    let hasHeader = true;
    server.use(
      http.get(`${API_URL}/health`, ({ request }) => {
        hasHeader = request.headers.has('Authorization');
        return HttpResponse.json({});
      }),
    );

    await client.get('/health');

    expect(hasHeader).toBe(false);
  });

  it('sends JSON bodies on mutations', async () => {
    let received: unknown = null;
    server.use(
      http.post(`${API_URL}/reservas`, async ({ request }) => {
        received = await request.json();
        return HttpResponse.json({ id: 1 }, { status: 201 });
      }),
    );

    await expect(client.post('/reservas', { recurso_id: 3 })).resolves.toEqual({ id: 1 });
    expect(received).toEqual({ recurso_id: 3 });
  });

  it('turns domain errors into ApiError with detail and code', async () => {
    server.use(
      http.post(`${API_URL}/reservas`, () =>
        HttpResponse.json(
          { detail: 'Este horário acabou de ser reservado.', code: 'RESERVA_CONFLITO' },
          { status: 409 },
        ),
      ),
    );

    const error = await captureError(client.post('/reservas', {}));

    expect(error).toMatchObject({
      status: 409,
      code: 'RESERVA_CONFLITO',
      message: 'Este horário acabou de ser reservado.',
    });
  });

  it('maps validation errors to field errors', async () => {
    server.use(
      http.post(`${API_URL}/auth/cadastro`, () =>
        HttpResponse.json(
          { detail: [{ loc: ['body', 'email'], msg: 'value is not a valid email address' }] },
          { status: 422 },
        ),
      ),
    );

    const error = await captureError(client.post('/auth/cadastro', {}));

    expect(error.code).toBe('VALIDACAO');
    expect(error.message).toBe('Revise os campos destacados.');
    expect(error.fieldErrors).toEqual([
      { field: 'email', message: 'value is not a valid email address' },
    ]);
  });

  it('uses a friendly message for server failures without the standard body', async () => {
    server.use(http.get(`${API_URL}/health`, () => new HttpResponse('<html>', { status: 502 })));

    const error = await captureError(client.get('/health'));

    expect(error).toMatchObject({ status: 502, code: 'HTTP_502' });
    expect(error.message).toMatch(/servidor não conseguiu responder/);
  });

  it('reports network failures as SEM_CONEXAO', async () => {
    server.use(http.get(`${API_URL}/health`, () => HttpResponse.error()));

    const error = await captureError(client.get('/health'));

    expect(error.isNetworkError).toBe(true);
    expect(error.code).toBe('SEM_CONEXAO');
  });

  it('clears the session and notifies on 401', async () => {
    tokenStore.set('expirado');
    const onUnauthorized = vi.fn<() => void>();
    client.setUnauthorizedHandler(onUnauthorized);
    server.use(
      http.get(`${API_URL}/auth/me`, () =>
        HttpResponse.json(
          { detail: 'Faça login para continuar.', code: 'NAO_AUTENTICADO' },
          { status: 401 },
        ),
      ),
    );

    await captureError(client.get('/auth/me'));

    expect(tokenStore.get()).toBeNull();
    expect(onUnauthorized).toHaveBeenCalledOnce();
  });

  it('does not end a session on 401 when there was no session (wrong password)', async () => {
    const onUnauthorized = vi.fn<() => void>();
    client.setUnauthorizedHandler(onUnauthorized);
    server.use(
      http.post(`${API_URL}/auth/login`, () =>
        HttpResponse.json(
          { detail: 'E-mail ou senha incorretos.', code: 'CREDENCIAIS_INVALIDAS' },
          { status: 401 },
        ),
      ),
    );

    const error = await captureError(client.post('/auth/login', {}));

    expect(error.code).toBe('CREDENCIAIS_INVALIDAS');
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it('repeats list params and leaves out empty ones', async () => {
    let query = '';
    server.use(
      http.get(`${API_URL}/recursos`, ({ request }) => {
        query = new URL(request.url).search;
        return HttpResponse.json({});
      }),
    );

    await client.get('/recursos', {
      params: { page: 1, caracteristicas: [2, 5], tipo: undefined, bloco_id: null, ativo: true },
    });

    expect(query).toBe('?page=1&caracteristicas=2&caracteristicas=5&ativo=true');
  });

  it('resolves to undefined when the response has no body', async () => {
    server.use(http.delete(`${API_URL}/x`, () => new HttpResponse(null, { status: 204 })));

    await expect(client.delete('/x')).resolves.toBeUndefined();
  });

  it('gives up after the timeout and reports TEMPO_ESGOTADO', async () => {
    const impatient = new HttpClient({ baseURL: API_URL, tokenStore, timeoutMs: 50 });
    server.use(
      http.get(`${API_URL}/health`, async () => {
        await delay(500);
        return HttpResponse.json({});
      }),
    );

    const error = await captureError(impatient.get('/health'));

    expect(error).toMatchObject({ status: 0, code: 'TEMPO_ESGOTADO' });
    expect(error.isNetworkError).toBe(true);
  });

  it('supports put, patch and delete', async () => {
    server.use(
      http.put(`${API_URL}/x`, () => HttpResponse.json('put')),
      http.patch(`${API_URL}/x`, () => HttpResponse.json('patch')),
      http.delete(`${API_URL}/x`, () => HttpResponse.json('delete')),
    );

    await expect(client.put('/x', {})).resolves.toBe('put');
    await expect(client.patch('/x', {})).resolves.toBe('patch');
    await expect(client.delete('/x')).resolves.toBe('delete');
  });
});

describe('ApiError.from', () => {
  it('wraps unknown errors', () => {
    expect(ApiError.from(new TypeError('boom')).code).toBe('ERRO_DESCONHECIDO');
  });

  it('keeps an existing ApiError', () => {
    const original = new ApiError('x', { status: 400, code: 'A' });

    expect(ApiError.from(original)).toBe(original);
  });
});
