import type { HttpClient } from '@/lib/api/http-client';
import type { Page, UserAdminCreate, UserAdminUpdate, UserRead } from '@/lib/api/types';

export interface UserListParams {
  page: number;
  per_page: number;
  busca?: string;
}

export class AdminUsersApi {
  readonly #http: HttpClient;

  constructor(http: HttpClient) {
    this.#http = http;
  }

  list(params: UserListParams): Promise<Page<UserRead>> {
    return this.#http.get<Page<UserRead>>('/admin/usuarios', { params });
  }

  create(data: UserAdminCreate): Promise<UserRead> {
    return this.#http.post<UserRead>('/admin/usuarios', data);
  }

  /** Perfil e/ou situação. Desativar derruba a sessão e cancela as reservas futuras. */
  update(id: number, data: UserAdminUpdate): Promise<UserRead> {
    return this.#http.patch<UserRead>(`/admin/usuarios/${id}`, data);
  }
}
