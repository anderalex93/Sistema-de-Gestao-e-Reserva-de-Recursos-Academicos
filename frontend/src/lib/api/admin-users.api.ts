import type { HttpClient } from '@/lib/api/http-client';
import type { Page, UserAdminCreate, UserRead } from '@/lib/api/types';

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
}
