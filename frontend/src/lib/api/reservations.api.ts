import type { HttpClient } from '@/lib/api/http-client';
import type { ReceiptRead, ReservationCreate, ReservationRead } from '@/lib/api/types';

export class ReservationsApi {
  readonly #http: HttpClient;

  constructor(http: HttpClient) {
    this.#http = http;
  }

  create(data: ReservationCreate): Promise<ReservationRead> {
    return this.#http.post<ReservationRead>('/reservas', data);
  }

  /** Público: não exige login. */
  receipt(codigo: string): Promise<ReceiptRead> {
    return this.#http.get<ReceiptRead>(`/reservas/comprovante/${encodeURIComponent(codigo)}`);
  }

  get(id: number): Promise<ReservationRead> {
    return this.#http.get<ReservationRead>(`/reservas/${id}`);
  }
}
