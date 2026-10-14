import { ApiError } from '@/lib/api/api-error';
import type { TokenStore } from '@/lib/api/token-store';

export interface HttpClientOptions {
  baseURL: string;
  tokenStore: TokenStore;
  timeoutMs?: number;
}

export interface RequestOptions {
  /** Filtros da query string (interfaces `XParams` das classes de API). Nulos são omitidos. */
  params?: object;
}

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/** Listas repetem a chave (`c=1&c=2`), o formato que o FastAPI lê. */
function queryString(params: object | undefined): string {
  if (!params) return '';
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    for (const item of Array.isArray(value) ? value : [value]) {
      if (item !== null && item !== undefined) search.append(key, String(item));
    }
  }
  const encoded = search.toString();
  return encoded ? `?${encoded}` : '';
}

async function readBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return undefined;
  if (!response.headers.get('Content-Type')?.includes('json')) return text;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/**
 * Único ponto de saída HTTP do frontend, sobre o `fetch` nativo. Anexa o token, converte
 * qualquer falha em `ApiError` e avisa o `AuthContext` (via `setUnauthorizedHandler`) quando a
 * sessão expira.
 */
export class HttpClient {
  readonly #baseURL: string;
  readonly #tokenStore: TokenStore;
  readonly #timeoutMs: number;
  #onUnauthorized: (() => void) | null = null;

  constructor({ baseURL, tokenStore, timeoutMs = 15_000 }: HttpClientOptions) {
    this.#baseURL = baseURL;
    this.#tokenStore = tokenStore;
    this.#timeoutMs = timeoutMs;
  }

  setUnauthorizedHandler(handler: (() => void) | null): void {
    this.#onUnauthorized = handler;
  }

  get<T>(url: string, options?: RequestOptions): Promise<T> {
    return this.#request<T>('GET', url, undefined, options);
  }

  post<T>(url: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.#request<T>('POST', url, body, options);
  }

  put<T>(url: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.#request<T>('PUT', url, body, options);
  }

  patch<T>(url: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.#request<T>('PATCH', url, body, options);
  }

  delete<T>(url: string, options?: RequestOptions): Promise<T> {
    return this.#request<T>('DELETE', url, undefined, options);
  }

  async #request<T>(
    method: Method,
    url: string,
    body: unknown,
    options: RequestOptions = {},
  ): Promise<T> {
    const hadSession = this.#tokenStore.get() !== null;
    try {
      return (await this.#send(method, url, body, options)) as T;
    } catch (error) {
      const apiError = ApiError.from(error);
      // 401 sem token é credencial errada (login), não sessão expirada.
      if (apiError.status === 401 && hadSession) {
        this.#tokenStore.clear();
        this.#onUnauthorized?.();
      }
      throw apiError;
    }
  }

  async #send(method: Method, url: string, body: unknown, options: RequestOptions) {
    const headers = new Headers({ Accept: 'application/json' });
    const token = this.#tokenStore.get();
    if (token) headers.set('Authorization', `Bearer ${token}`);
    if (body !== undefined) headers.set('Content-Type', 'application/json');

    let response: Response;
    try {
      response = await fetch(`${this.#baseURL}${url}${queryString(options.params)}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(this.#timeoutMs),
      });
    } catch (error) {
      throw ApiError.fromTransport(error);
    }

    const data = await readBody(response);
    if (!response.ok) throw ApiError.fromResponse(response.status, data);
    return data;
  }
}
