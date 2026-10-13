import { describe, expect, it } from 'vitest';

import { ApiError } from '@/lib/api/api-error';
import { createQueryClient, shouldRetry } from '@/lib/query-client';

const networkError = new ApiError('rede', { status: 0, code: 'SEM_CONEXAO' });
const serverError = new ApiError('500', { status: 500, code: 'ERRO_INTERNO' });
const conflict = new ApiError('409', { status: 409, code: 'RESERVA_CONFLITO' });

describe('shouldRetry', () => {
  it('retries transient failures up to twice', () => {
    expect(shouldRetry(0, networkError)).toBe(true);
    expect(shouldRetry(1, serverError)).toBe(true);
    expect(shouldRetry(2, serverError)).toBe(false);
  });

  it('never retries business errors or unknown errors', () => {
    expect(shouldRetry(0, conflict)).toBe(false);
    expect(shouldRetry(0, new Error('x'))).toBe(false);
  });
});

it('createQueryClient disables mutation retries', () => {
  expect(createQueryClient().getDefaultOptions().mutations?.retry).toBe(false);
});
