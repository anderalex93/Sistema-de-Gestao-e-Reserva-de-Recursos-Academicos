import type { HttpClient } from '@/lib/api/http-client';
import type { ReservationCreate, ReservationRead } from '@/lib/api/types';

export class ReservationsApi {
  readonly #http: HttpClient;

  constructor(http: HttpClient) {
    this.#http = http;
  }

  create(data: ReservationCreate): Promise<ReservationRead> {
    return this.#http.post<ReservationRead>('/reservas', data);
  }

  get(id: number): Promise<ReservationRead> {
    return this.#http.get<ReservationRead>(`/reservas/${id}`);
  }
}
