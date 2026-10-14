import type { ReservationStatus } from '@/lib/api/types';

export type DisplayStatus = 'CONFIRMADA' | 'CANCELADA' | 'CONCLUIDA' | 'NAO_COMPARECEU';

/** "Concluída" não é gravada: é uma reserva confirmada que já terminou (DER, decisões). */
export function displayStatus(
  status: ReservationStatus,
  fim: string,
  now: Date = new Date(),
): DisplayStatus {
  if (status === 'CANCELADA' || status === 'NAO_COMPARECEU') return status;
  return Date.parse(fim) <= now.getTime() ? 'CONCLUIDA' : 'CONFIRMADA';
}
