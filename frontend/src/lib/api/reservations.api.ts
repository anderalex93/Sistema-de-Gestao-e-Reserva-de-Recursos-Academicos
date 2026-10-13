import type { HttpClient } from '@/lib/api/http-client';
import type {
  MyReservationRead,
  Page,
  ReceiptRead,
  ReservationCreate,
  ReservationRead,
  ReservationScope,
} from '@/lib/api/types';

export interface MyReservationsParams {
  escopo: ReservationScope;
  page: number;
  per_page: number;
}

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

  listMine(params: MyReservationsParams): Promise<Page<MyReservationRead>> {
    return this.#http.get<Page<MyReservationRead>>('/reservas/minhas', { params });
  }

  cancel(id: number): Promise<MyReservationRead> {
    return this.#http.post<MyReservationRead>(`/reservas/${id}/cancelar`);
  }

  get(id: number): Promise<ReservationRead> {
    return this.#http.get<ReservationRead>(`/reservas/${id}`);
  }
}
