import { config } from '@/config';
import { HealthApi } from '@/lib/api/health.api';
import { HttpClient } from '@/lib/api/http-client';
import { LocalStorageTokenStore } from '@/lib/api/token-store';

export const tokenStore = new LocalStorageTokenStore();
export const httpClient = new HttpClient({ baseURL: config.apiUrl, tokenStore });

export const healthApi = new HealthApi(httpClient);
