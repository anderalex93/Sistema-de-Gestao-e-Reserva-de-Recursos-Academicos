import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { catalogApi } from '@/lib/api';
import type { ResourceListParams } from '@/lib/api/catalog.api';
import { liveQueryOptions } from '@/lib/live-query';
import { queryKeys } from '@/lib/query-keys';

/** Blocos e características mudam pouco: ficam em cache por 10 minutos. */
const REFERENCE_STALE_MS = 10 * 60_000;

export function useResourceList(params: ResourceListParams) {
  return useQuery({
    queryKey: queryKeys.resourceList(params),
    queryFn: () => catalogApi.listResources(params),
    placeholderData: keepPreviousData,
    ...liveQueryOptions,
  });
}

export function useResource(id: number) {
  return useQuery({
    queryKey: queryKeys.resource(id),
    queryFn: () => catalogApi.getResource(id),
    enabled: Number.isInteger(id) && id > 0,
  });
}

export function useBuildings() {
  return useQuery({
    queryKey: queryKeys.buildings,
    queryFn: () => catalogApi.listBuildings(),
    staleTime: REFERENCE_STALE_MS,
  });
}

export function useFeatures() {
  return useQuery({
    queryKey: queryKeys.features,
    queryFn: () => catalogApi.listFeatures(),
    staleTime: REFERENCE_STALE_MS,
  });
}

/** Grade do dia. Muda a cada reserva, inclusive de outras pessoas: cache curto e sempre ao vivo. */
export function useAvailability(resourceId: number, date: string) {
  return useQuery({
    queryKey: queryKeys.availability(resourceId, date),
    queryFn: () => catalogApi.getAvailability(resourceId, date),
    enabled: Number.isInteger(resourceId) && resourceId > 0,
    // Curto, mas não zero: a página do recurso já busca a grade antes de a seção montar, e a
    // seção não deve repetir a mesma consulta. O polling segue mantendo a grade atualizada.
    staleTime: 5_000,
    placeholderData: keepPreviousData,
    ...liveQueryOptions,
  });
}
