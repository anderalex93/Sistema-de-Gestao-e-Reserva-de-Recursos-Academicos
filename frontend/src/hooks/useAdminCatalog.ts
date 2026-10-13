import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';

import { adminCatalogApi } from '@/lib/api';
import type { AdminResourceListParams } from '@/lib/api/admin-catalog.api';
import { queryKeys } from '@/lib/query-keys';

export function useAdminResources(params: AdminResourceListParams) {
  return useQuery({
    queryKey: queryKeys.adminResourceList(params),
    queryFn: () => adminCatalogApi.listResources(params),
    placeholderData: keepPreviousData,
  });
}

export function useAdminBuildings() {
  return useQuery({
    queryKey: queryKeys.adminBuildings,
    queryFn: () => adminCatalogApi.listBuildings(),
  });
}

export function useAdminFeatures() {
  return useQuery({
    queryKey: queryKeys.adminFeatures,
    queryFn: () => adminCatalogApi.listFeatures(),
  });
}

/**
 * Toda mudança no catálogo vale na hora para quem reserva: busca, detalhe, quadro, filtros e,
 * quando uma desativação cancela reservas, as listas de reservas.
 */
function invalidateCatalog(queryClient: QueryClient) {
  return Promise.all(
    [
      queryKeys.adminCatalog,
      queryKeys.resources,
      queryKeys.buildings,
      queryKeys.features,
      queryKeys.reservations,
    ].map((queryKey) => queryClient.invalidateQueries({ queryKey })),
  );
}

export function useCatalogMutation<Variables, Result>(
  mutationFn: (variables: Variables) => Promise<Result>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => invalidateCatalog(queryClient),
  });
}
