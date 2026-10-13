import { useQuery } from '@tanstack/react-query';

import { DEFAULT_RULES, rulesFrom, type CampusRules } from '@/domain/rules';
import { configApi } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

/** Horário e regras de uso. Até a API responder, valem os padrões do campus. */
export function useRules(): CampusRules {
  const query = useQuery({
    queryKey: queryKeys.rules,
    queryFn: () => configApi.getRules(),
    staleTime: Infinity,
    select: rulesFrom,
  });
  return query.data ?? DEFAULT_RULES;
}
