import type { AdminResourceListParams } from '@/lib/api/admin-catalog.api';
import type { UserListParams } from '@/lib/api/admin-users.api';
import type { BoardParams } from '@/lib/api/board.api';
import type { ResourceListParams } from '@/lib/api/catalog.api';
import type { MyReservationsParams } from '@/lib/api/reservations.api';

/** Chaves do TanStack Query centralizadas, para invalidar sempre o domínio certo. */
export const queryKeys = {
  me: ['auth', 'me'] as const,
  adminUsers: ['admin', 'usuarios'] as const,
  adminUserList: (params: UserListParams) => ['admin', 'usuarios', params] as const,
  adminCatalog: ['admin', 'catalogo'] as const,
  adminResourceList: (params: AdminResourceListParams) =>
    ['admin', 'catalogo', 'recursos', params] as const,
  adminBuildings: ['admin', 'catalogo', 'blocos'] as const,
  adminFeatures: ['admin', 'catalogo', 'caracteristicas'] as const,
  resources: ['recursos'] as const,
  resourceList: (params: ResourceListParams) => ['recursos', 'lista', params] as const,
  resource: (id: number) => ['recursos', 'detalhe', id] as const,
  buildings: ['blocos'] as const,
  features: ['caracteristicas'] as const,
  board: (params: BoardParams) => ['recursos', 'quadro', params] as const,
  reservations: ['reservas'] as const,
  myReservations: (params: MyReservationsParams) => ['reservas', 'minhas', params] as const,
  receipt: (codigo: string) => ['reservas', 'comprovante', codigo.toUpperCase()] as const,
  rules: ['config', 'regras'] as const,
  availability: (resourceId: number, date: string) =>
    ['recursos', 'disponibilidade', resourceId, date] as const,
};
