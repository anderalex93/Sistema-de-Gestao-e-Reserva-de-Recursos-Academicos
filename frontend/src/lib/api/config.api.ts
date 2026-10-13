import type { HttpClient } from '@/lib/api/http-client';
import type { RulesRead } from '@/lib/api/types';

export class ConfigApi {
  readonly #http: HttpClient;

  constructor(http: HttpClient) {
    this.#http = http;
  }

  getRules(): Promise<RulesRead> {
    return this.#http.get<RulesRead>('/config/regras');
  }
}
