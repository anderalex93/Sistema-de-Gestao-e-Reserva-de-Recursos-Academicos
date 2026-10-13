import { http, HttpResponse } from 'msw';

import { addDays, campusToday, campusToUtcIso, isoWeekday } from '@/domain/schedule';
import type {
  AvailabilityRead,
  BuildingRead,
  FeatureRead,
  Page,
  ResourceRead,
  RulesRead,
  SlotRead,
} from '@/lib/api/types';
import { api } from '@/test/render';
import { server } from '@/test/server';

export const buildings: BuildingRead[] = [
  { id: 1, nome: 'Bloco A', descricao: 'Entrada principal' },
  { id: 4, nome: 'Bloco D', descricao: null },
];

export const features: FeatureRead[] = [
  { id: 2, nome: 'Ar-condicionado' },
  { id: 1, nome: 'Projetor' },
];

export const rules: RulesRead = {
  fuso: 'America/Maceio',
  intervalo_minutos: 30,
  horarios: [1, 2, 3, 4, 5]
    .map((dia_semana) => ({ dia_semana, abertura: '08:00:00', fechamento: '21:00:00' }))
    .concat([{ dia_semana: 6, abertura: '08:00:00', fechamento: '12:00:00' }]),
};

/** Próximo dia útil depois de hoje (segunda a sexta, 08:00 às 21:00). */
export function nextWeekday(): string {
  let day = addDays(campusToday(), 1);
  while (isoWeekday(day) > 5) day = addDays(day, 1);
  return day;
}

/** Próximo domingo, quando o campus não abre. */
export function nextSunday(): string {
  let day = addDays(campusToday(), 1);
  while (isoWeekday(day) !== 7) day = addDays(day, 1);
  return day;
}

/**
 * Grade do dia no horário padrão (seg a sex 08:00 às 21:00, sáb até 12:00, dom fechado),
 * toda livre, com exceções por horário de início: `{ '19:00': { status: 'OCUPADO' } }`.
 */
export function buildAvailability(
  recursoId: number,
  data: string,
  overrides: Record<string, Partial<SlotRead>> = {},
): AvailabilityRead {
  const weekday = isoWeekday(data);
  if (weekday === 7) return { recurso_id: recursoId, data, slots: [] };
  const closing = weekday === 6 ? 12 : 21;
  const time = (total: number) =>
    `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
  const slots: SlotRead[] = [];
  for (let minutes = 8 * 60; minutes < closing * 60; minutes += 30) {
    slots.push({
      inicio: campusToUtcIso(data, time(minutes)),
      fim: campusToUtcIso(data, time(minutes + 30)),
      status: 'LIVRE',
      propria: false,
      reservado_por: null,
      ...overrides[time(minutes)],
    });
  }
  return { recurso_id: recursoId, data, slots };
}

export function buildResource(overrides: Partial<ResourceRead> = {}): ResourceRead {
  return {
    id: 204,
    nome: 'Sala de estudo 204',
    tipo: 'SALA_ESTUDO',
    capacidade: 6,
    andar: '1º andar',
    descricao: null,
    bloco: { id: 1, nome: 'Bloco A', descricao: 'Entrada principal' },
    caracteristicas: [
      { id: 2, nome: 'Ar-condicionado' },
      { id: 1, nome: 'Projetor' },
    ],
    ...overrides,
  };
}

export function resourcePage(
  items: ResourceRead[],
  { page = 1, perPage = 24, total = items.length } = {},
): Page<ResourceRead> {
  return { items, total, page, per_page: perPage, total_pages: Math.ceil(total / perPage) };
}

/** Catálogo respondendo com estes recursos na lista e no detalhe, mais blocos e características. */
export function serveCatalog(resources: ResourceRead[]) {
  server.use(
    http.get(api('/config/regras'), () => HttpResponse.json(rules)),
    http.get(api('/blocos'), () => HttpResponse.json(buildings)),
    http.get(api('/recursos/:id/disponibilidade'), ({ params, request }) => {
      const data = new URL(request.url).searchParams.get('data') ?? campusToday();
      return HttpResponse.json(buildAvailability(Number(params.id), data));
    }),
    http.get(api('/caracteristicas'), () => HttpResponse.json(features)),
    http.get(api('/recursos'), () => HttpResponse.json(resourcePage(resources))),
    http.get(api('/recursos/:id'), ({ params }) => {
      const found = resources.find((resource) => String(resource.id) === params.id);
      return found
        ? HttpResponse.json(found)
        : HttpResponse.json(
            { detail: 'Recurso não encontrado.', code: 'NAO_ENCONTRADO' },
            { status: 404 },
          );
    }),
  );
}
