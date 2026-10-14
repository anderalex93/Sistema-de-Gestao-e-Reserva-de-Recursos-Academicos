import { campusToUtcIso } from '@/domain/schedule';
import type { ReceiptRead } from '@/lib/api/types';
import { nextWeekday } from '@/test/catalog';

export function buildReceipt(overrides: Partial<ReceiptRead> = {}): ReceiptRead {
  const day = nextWeekday();
  return {
    codigo: 'EDU-7K3F9Q',
    status: 'CONFIRMADA',
    inicio: campusToUtcIso(day, '19:00'),
    fim: campusToUtcIso(day, '21:00'),
    recurso: {
      nome: 'Sala de estudo 204',
      tipo: 'SALA_ESTUDO',
      andar: '1º andar',
      bloco: { nome: 'Bloco A' },
    },
    responsavel: 'Lucas',
    cancelada_em: null,
    checkin_em: null,
    encerrada_em: null,
    ...overrides,
  };
}
