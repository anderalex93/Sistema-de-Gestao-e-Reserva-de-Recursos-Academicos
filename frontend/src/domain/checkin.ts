import { checkinWindow, type CampusRules } from '@/domain/rules';
import { campusTime } from '@/domain/schedule';
import type { ReservationRead } from '@/lib/api/types';

export type CheckinNoteKind = 'feito' | 'liberada' | 'pendente';

export interface CheckinNote {
  kind: CheckinNoteKind;
  text: string;
}

type CheckinFields = Pick<
  ReservationRead,
  'status' | 'inicio' | 'fim' | 'checkin_em' | 'liberada_em'
>;

/**
 * O que dizer sobre o check-in de uma reserva (#43): presença confirmada, liberada por falta de
 * check-in ou a janela em que a pessoa precisa ler o QR da porta. `null` quando não há nada a
 * dizer (cancelada, encerrada sem check-in ou check-in opcional).
 */
export function checkinNote(
  reservation: CheckinFields,
  rules: CampusRules,
  now: Date = new Date(),
): CheckinNote | null {
  if (reservation.checkin_em) {
    return { kind: 'feito', text: `Presença confirmada às ${campusTime(reservation.checkin_em)}` };
  }
  if (reservation.status === 'NAO_COMPARECEU') {
    const at = reservation.liberada_em ? ` às ${campusTime(reservation.liberada_em)}` : '';
    return { kind: 'liberada', text: `Liberada${at}: não houve check-in no prazo` };
  }
  if (reservation.status !== 'CONFIRMADA' || Date.parse(reservation.fim) <= now.getTime()) {
    return null;
  }
  const { opensAt, deadline } = checkinWindow(rules, reservation.inicio);
  if (!deadline || deadline.getTime() <= now.getTime()) return null;
  return {
    kind: 'pendente',
    text: `Check-in pelo QR da porta entre ${campusTime(opensAt.toISOString())} e ${campusTime(deadline.toISOString())}`,
  };
}
