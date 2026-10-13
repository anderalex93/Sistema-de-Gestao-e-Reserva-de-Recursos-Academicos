import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';

import { AuthContext, type AuthContextValue, type AuthStatus } from '@/contexts/auth-context';
import { useFeedback } from '@/hooks/useFeedback';
import { authApi, httpClient, tokenStore } from '@/lib/api';
import type { LoginRequest } from '@/lib/api/types';
import { loadFailure } from '@/lib/load-failure';
import { queryKeys } from '@/lib/query-keys';
import { paths } from '@/router/paths';

/**
 * Sessão do usuário. O token fica no TokenStore (ADR 0001); quem está logado vem de `/auth/me`
 * e fica no cache do TanStack Query, restaurado ao recarregar a página.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { notify } = useFeedback();
  const [hasToken, setHasToken] = useState(() => tokenStore.get() !== null);

  const meQuery = useQuery({
    queryKey: queryKeys.me,
    queryFn: () => authApi.me(),
    enabled: hasToken,
    staleTime: Infinity,
  });

  const endSession = useCallback(() => {
    tokenStore.clear();
    setHasToken(false);
    queryClient.clear();
  }, [queryClient]);

  useEffect(() => {
    httpClient.setUnauthorizedHandler(() => {
      endSession();
      notify({ message: 'Sua sessão expirou. Entre novamente.', severity: 'info' });
    });
    return () => httpClient.setUnauthorizedHandler(null);
  }, [endSession, notify]);

  const login = useCallback(
    async (credentials: LoginRequest) => {
      const token = await authApi.login(credentials);
      tokenStore.set(token.access_token);
      queryClient.setQueryData(queryKeys.me, token.usuario);
      setHasToken(true);
      return token.usuario;
    },
    [queryClient],
  );

  const logout = useCallback(() => {
    endSession();
    navigate(paths.login, { replace: true });
    notify({ message: 'Você saiu da sua conta.', severity: 'info' });
  }, [endSession, navigate, notify]);

  const { refetch } = meQuery;
  const retry = useCallback(() => void refetch(), [refetch]);

  const user = hasToken ? (meQuery.data ?? null) : null;
  let status: AuthStatus = 'anonymous';
  if (user) status = 'authenticated';
  else if (hasToken && meQuery.isPending) status = 'loading';
  else if (hasToken && loadFailure(meQuery)) status = 'error';

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, login, logout, retry }),
    [status, user, login, logout, retry],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
