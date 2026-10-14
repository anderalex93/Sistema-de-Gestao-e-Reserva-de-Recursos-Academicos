import { useSearchParams } from 'react-router';

import { lastBookableDate } from '@/domain/rules';
import { campusToday, isTimeMark } from '@/domain/schedule';
import { useRules } from '@/hooks/useRules';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export interface AvailabilityDay {
  /** Dia mostrado na grade (`AAAA-MM-DD`). */
  date: string;
  /** Intervalo que veio da busca (`?inicio=&fim=`), se válido. */
  inicio: string | null;
  fim: string | null;
  setDate: (date: string) => void;
}

/**
 * Dia da grade na URL (`?data=`), para o link do resultado da busca já abrir no dia certo.
 * Nunca antes de hoje; além da antecedência máxima, mostra o último dia permitido.
 */
export function useAvailabilityDay(maxDate: string): AvailabilityDay {
  const [params, setParams] = useSearchParams();
  const today = campusToday();
  const raw = params.get('data');
  const valid = raw && DATE_PATTERN.test(raw) && raw >= today ? raw : today;
  const inicio = params.get('inicio');
  const fim = params.get('fim');
  const setDate = (next: string) =>
    setParams(
      (current) => {
        const updated = new URLSearchParams(current);
        updated.set('data', next);
        updated.delete('inicio');
        updated.delete('fim');
        return updated;
      },
      { replace: true },
    );
  return {
    date: valid > maxDate ? maxDate : valid,
    inicio: inicio && isTimeMark(inicio) ? inicio : null,
    fim: fim && isTimeMark(fim) ? fim : null,
    setDate,
  };
}

/** Só o dia, com as regras de uso já aplicadas: a página do recurso o usa para adiantar a grade. */
export function useAvailabilityDate(): string {
  const rules = useRules();
  return useAvailabilityDay(lastBookableDate(rules)).date;
}
