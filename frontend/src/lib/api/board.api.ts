import type { HttpClient } from '@/lib/api/http-client';
import type { BoardRead, ResourceType } from '@/lib/api/types';

export interface BoardParams {
  /** `AAAA-MM-DD`, fuso do campus. */
  data: string;
  bloco_id?: number;
  tipo?: ResourceType;
}

export class BoardApi {
  readonly #http: HttpClient;

  constructor(http: HttpClient) {
    this.#http = http;
  }

  get(params: BoardParams): Promise<BoardRead> {
    return this.#http.get<BoardRead>('/quadro', { params });
  }
}
