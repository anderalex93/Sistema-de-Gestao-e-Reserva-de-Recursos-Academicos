import { useMutation, useQueryClient } from '@tanstack/react-query';

import { authApi } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

/** Aceite no primeiro acesso: a sessão passa a enxergar a data e libera o app. */
export function useAcceptTerms() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => authApi.acceptTerms(),
    onSuccess: (user) => queryClient.setQueryData(queryKeys.me, user),
  });
}

export function useExportData() {
  return useMutation({ mutationFn: () => authApi.exportData() });
}

export function useDeleteAccount() {
  return useMutation({ mutationFn: (senha: string) => authApi.deleteAccount(senha) });
}
