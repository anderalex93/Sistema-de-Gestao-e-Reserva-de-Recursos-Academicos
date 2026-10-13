import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';

import { ApiError } from '@/lib/api/api-error';
import type { TokenStore } from '@/lib/api/token-store';

export interface HttpClientOptions {
  baseURL: string;
  tokenStore: TokenStore;
  timeoutMs?: number;
}

export type RequestOptions = Pick<AxiosRequestConfig, 'params' | 'signal' | 'headers'>;

/**
 * Único ponto de saída HTTP do frontend. Anexa o token, converte qualquer falha em `ApiError`
 * e avisa o `AuthContext` (via `setUnauthorizedHandler`) quando a sessão expira.
 */
export class HttpClient {
  readonly #axios: AxiosInstance;
  readonly #tokenStore: TokenStore;
  #onUnauthorized: (() => void) | null = null;

  constructor({ baseURL, tokenStore, timeoutMs = 15_000 }: HttpClientOptions) {
    this.#tokenStore = tokenStore;
    // Adaptador fetch: mesmo transporte no navegador e nos testes (o MSW intercepta fetch).
    this.#axios = axios.create({ baseURL, timeout: timeoutMs, adapter: 'fetch' });
    this.#axios.interceptors.request.use((request) => {
      const token = this.#tokenStore.get();
      if (token) {
        request.headers.set('Authorization', `Bearer ${token}`);
      }
      return request;
    });
  }

  setUnauthorizedHandler(handler: (() => void) | null): void {
    this.#onUnauthorized = handler;
  }

  get<T>(url: string, options?: RequestOptions): Promise<T> {
    return this.#request<T>({ ...options, method: 'GET', url });
  }

  post<T>(url: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.#request<T>({ ...options, method: 'POST', url, data: body });
  }

  put<T>(url: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.#request<T>({ ...options, method: 'PUT', url, data: body });
  }

  patch<T>(url: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.#request<T>({ ...options, method: 'PATCH', url, data: body });
  }

  delete<T>(url: string, options?: RequestOptions): Promise<T> {
    return this.#request<T>({ ...options, method: 'DELETE', url });
  }

  async #request<T>(request: AxiosRequestConfig): Promise<T> {
    const hadSession = this.#tokenStore.get() !== null;
    try {
      const response = await this.#axios.request<T>(request);
      return response.data;
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
}
