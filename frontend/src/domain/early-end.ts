import { SLOT_MINUTES } from '@/domain/schedule';
import type { ReservationRead } from '@/lib/api/types';

const SLOT_MS = SLOT_MINUTES * 60_000;

/**
 * A partir de quando a sala fica livre se o uso for encerrado agora, como o back calcula: a
 * próxima marca de 30 minutos, nunca antes de `inicio + 30 min` nem depois do fim. Maceió é
 * UTC-3 o ano todo, então as marcas locais (:00 e :30) caem nas mesmas marcas em UTC.
 */
export function freeFrom(
  reservation: Pick<ReservationRead, 'inicio' | 'fim'>,
  now: Date = new Date(),
): string {
  const nextMark = Math.ceil(now.getTime() / SLOT_MS) * SLOT_MS;
  const earliest = Date.parse(reservation.inicio) + SLOT_MS;
  const end = Math.min(Math.max(nextMark, earliest), Date.parse(reservation.fim));
  return new Date(end).toISOString();
}
