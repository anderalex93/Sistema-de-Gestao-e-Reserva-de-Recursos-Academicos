import type { UserListParams } from '@/lib/api/admin-users.api';
import type { ResourceListParams } from '@/lib/api/catalog.api';

/** Chaves do TanStack Query centralizadas, para invalidar sempre o domínio certo. */
export const queryKeys = {
  me: ['auth', 'me'] as const,
  adminUsers: ['admin', 'usuarios'] as const,
  adminUserList: (params: UserListParams) => ['admin', 'usuarios', params] as const,
  resources: ['recursos'] as const,
  resourceList: (params: ResourceListParams) => ['recursos', 'lista', params] as const,
  resource: (id: number) => ['recursos', 'detalhe', id] as const,
  buildings: ['blocos'] as const,
  features: ['caracteristicas'] as const,
  rules: ['config', 'regras'] as const,
  availability: (resourceId: number, date: string) =>
    ['recursos', 'disponibilidade', resourceId, date] as const,
};
