import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { adminOccupancyApi } from '@/lib/api';
import type { OccupancyParams } from '@/lib/api/admin-occupancy.api';
import { queryKeys } from '@/lib/query-keys';

export function useAdminOccupancy(params: OccupancyParams) {
  return useQuery({
    queryKey: queryKeys.adminOccupancy(params),
    queryFn: () => adminOccupancyApi.get(params),
    placeholderData: keepPreviousData,
  });
}
