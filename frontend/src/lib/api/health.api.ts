import type { HttpClient } from '@/lib/api/http-client';
import type { HealthRead } from '@/lib/api/types';

/** Modelo para as classes de API por domínio: recebe o HttpClient e expõe métodos tipados. */
export class HealthApi {
  readonly #http: HttpClient;

  constructor(http: HttpClient) {
    this.#http = http;
  }

  check(): Promise<HealthRead> {
    return this.#http.get<HealthRead>('/health');
  }
}
