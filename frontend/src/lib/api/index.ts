import { config } from '@/config';
import { AdminUsersApi } from '@/lib/api/admin-users.api';
import { AuthApi } from '@/lib/api/auth.api';
import { CatalogApi } from '@/lib/api/catalog.api';
import { ConfigApi } from '@/lib/api/config.api';
import { HealthApi } from '@/lib/api/health.api';
import { HttpClient } from '@/lib/api/http-client';
import { ReservationsApi } from '@/lib/api/reservations.api';
import { LocalStorageTokenStore } from '@/lib/api/token-store';

export const tokenStore = new LocalStorageTokenStore();
export const httpClient = new HttpClient({ baseURL: config.apiUrl, tokenStore });

export const healthApi = new HealthApi(httpClient);
export const authApi = new AuthApi(httpClient);
export const adminUsersApi = new AdminUsersApi(httpClient);
export const catalogApi = new CatalogApi(httpClient);
export const configApi = new ConfigApi(httpClient);
export const reservationsApi = new ReservationsApi(httpClient);
