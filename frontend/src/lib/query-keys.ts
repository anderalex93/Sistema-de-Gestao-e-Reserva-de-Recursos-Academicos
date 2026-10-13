import type { UserListParams } from '@/lib/api/admin-users.api';

/** Chaves do TanStack Query centralizadas, para invalidar sempre o domínio certo. */
export const queryKeys = {
  me: ['auth', 'me'] as const,
  adminUsers: ['admin', 'usuarios'] as const,
  adminUserList: (params: UserListParams) => ['admin', 'usuarios', params] as const,
};
