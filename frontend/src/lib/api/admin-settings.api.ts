import type { HttpClient } from '@/lib/api/http-client';
import type { CampusSettingsRead, CampusSettingsUpdate } from '@/lib/api/types';

/** Horário de funcionamento e regras de uso definidos pela administração. */
export class AdminSettingsApi {
  readonly #http: HttpClient;

  constructor(http: HttpClient) {
    this.#http = http;
  }

  get(): Promise<CampusSettingsRead> {
    return this.#http.get<CampusSettingsRead>('/admin/configuracoes');
  }

  update(data: CampusSettingsUpdate): Promise<CampusSettingsRead> {
    return this.#http.put<CampusSettingsRead>('/admin/configuracoes', data);
  }
}
