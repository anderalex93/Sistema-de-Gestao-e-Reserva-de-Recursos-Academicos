import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { adminSettingsApi } from '@/lib/api';
import type { CampusSettingsUpdate } from '@/lib/api/types';
import { queryKeys } from '@/lib/query-keys';

export function useAdminSettings() {
  return useQuery({ queryKey: queryKeys.adminSettings, queryFn: () => adminSettingsApi.get() });
}

/** Salva e atualiza tudo que depende do horário e das regras: grades, quadro e busca. */
export function useSaveAdminSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CampusSettingsUpdate) => adminSettingsApi.update(data),
    onSuccess: (saved) => {
      queryClient.setQueryData(queryKeys.adminSettings, saved);
      void queryClient.invalidateQueries({ queryKey: queryKeys.config });
      void queryClient.invalidateQueries({ queryKey: queryKeys.resources });
    },
  });
}
