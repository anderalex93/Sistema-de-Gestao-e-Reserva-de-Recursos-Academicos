import { QueryClient } from '@tanstack/react-query';

import { ApiError } from '@/lib/api/api-error';

const MAX_RETRIES = 2;

/** Repete só falhas transitórias (rede ou 5xx); erros de regra (4xx) aparecem na hora. */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= MAX_RETRIES) return false;
  return error instanceof ApiError && (error.isNetworkError || error.status >= 500);
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 30_000, retry: shouldRetry },
      mutations: { retry: false },
    },
  });
}
