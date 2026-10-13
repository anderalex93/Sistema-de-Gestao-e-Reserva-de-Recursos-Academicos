import type { HttpClient } from '@/lib/api/http-client';
import type { AdminReservationRead, Page, ReservationStatus } from '@/lib/api/types';

/** Parâmetros de `GET /admin/reservas`. `data` em AAAA-MM-DD no fuso do campus. */
export interface AgendaParams {
  data: string;
  page: number;
  per_page: number;
  bloco_id?: number;
  status?: ReservationStatus;
}

export class AdminReservationsApi {
  readonly #http: HttpClient;

  constructor(http: HttpClient) {
    this.#http = http;
  }

  agenda(params: AgendaParams): Promise<Page<AdminReservationRead>> {
    return this.#http.get<Page<AdminReservationRead>>('/admin/reservas', { params });
  }

  /** Sem o prazo de 30 minutos; o motivo aparece no histórico de quem reservou. */
  cancel(id: number, motivo: string): Promise<AdminReservationRead> {
    return this.#http.post<AdminReservationRead>(`/admin/reservas/${id}/cancelar`, { motivo });
  }
}
