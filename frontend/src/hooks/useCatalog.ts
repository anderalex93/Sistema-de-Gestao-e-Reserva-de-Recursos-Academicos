import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { catalogApi } from '@/lib/api';
import type { ResourceListParams } from '@/lib/api/catalog.api';
import { queryKeys } from '@/lib/query-keys';

/** Blocos e características mudam pouco: ficam em cache por 10 minutos. */
const REFERENCE_STALE_MS = 10 * 60_000;

export function useResourceList(params: ResourceListParams) {
  return useQuery({
    queryKey: queryKeys.resourceList(params),
    queryFn: () => catalogApi.listResources(params),
    placeholderData: keepPreviousData,
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

/** Grade do dia. Muda a cada reserva: sem cache longo. */
export function useAvailability(resourceId: number, date: string) {
  return useQuery({
    queryKey: queryKeys.availability(resourceId, date),
    queryFn: () => catalogApi.getAvailability(resourceId, date),
    staleTime: 0,
    placeholderData: keepPreviousData,
  });
}
