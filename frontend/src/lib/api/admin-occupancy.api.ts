import type { HttpClient } from '@/lib/api/http-client';
import type { OccupancyRead } from '@/lib/api/types';

export interface OccupancyParams {
  inicio?: string;
  fim?: string;
  bloco_id?: number;
}

/** Painel de ocupação da administração (#44). */
export class AdminOccupancyApi {
  readonly #http: HttpClient;

  constructor(http: HttpClient) {
    this.#http = http;
  }

  get(params: OccupancyParams): Promise<OccupancyRead> {
    return this.#http.get<OccupancyRead>('/admin/ocupacao', { params });
  }

  /** CSV por recurso, como texto: o download é montado no navegador com o token da sessão. */
  csv(params: OccupancyParams): Promise<string> {
    return this.#http.get<string>('/admin/ocupacao.csv', { params });
  }
}
