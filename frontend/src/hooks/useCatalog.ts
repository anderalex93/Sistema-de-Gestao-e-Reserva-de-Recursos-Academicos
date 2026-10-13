import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { catalogApi } from '@/lib/api';
import type { ResourceListParams } from '@/lib/api/catalog.api';
import { queryKeys } from '@/lib/query-keys';

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
