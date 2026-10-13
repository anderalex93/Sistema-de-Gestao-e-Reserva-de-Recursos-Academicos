import { useQuery } from '@tanstack/react-query';

import { DEFAULT_WEEKLY_HOURS, weeklyHoursFrom, type WeeklyHours } from '@/domain/schedule';
import { configApi } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

/** Horário de funcionamento por dia. Até a API responder, vale o padrão do campus. */
export function useWeeklyHours(): WeeklyHours {
  const query = useQuery({
    queryKey: queryKeys.rules,
    queryFn: () => configApi.getRules(),
    staleTime: Infinity,
    select: weeklyHoursFrom,
  });
  return query.data ?? DEFAULT_WEEKLY_HOURS;
}
