import type { HttpClient } from '@/lib/api/http-client';
import type { CheckinStatusRead, ReservationRead } from '@/lib/api/types';

/** Check-in pelo QR Code fixado na porta do espaço (#43). */
export class CheckinApi {
  readonly #http: HttpClient;

  constructor(http: HttpClient) {
    this.#http = http;
  }

  /** O que a pessoa encontra ao ler o QR: a reserva de hoje e se o check-in está aberto. */
  status(token: string): Promise<CheckinStatusRead> {
    return this.#http.get<CheckinStatusRead>(`/checkin/${encodeURIComponent(token)}`);
  }

  checkIn(token: string): Promise<ReservationRead> {
    return this.#http.post<ReservationRead>(`/checkin/${encodeURIComponent(token)}`);
  }
}
