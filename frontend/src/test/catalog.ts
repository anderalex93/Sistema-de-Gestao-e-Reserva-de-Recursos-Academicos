import { http, HttpResponse } from 'msw';

import type { BuildingRead, FeatureRead, Page, ResourceRead } from '@/lib/api/types';
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
    http.get(api('/blocos'), () => HttpResponse.json(buildings)),
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
