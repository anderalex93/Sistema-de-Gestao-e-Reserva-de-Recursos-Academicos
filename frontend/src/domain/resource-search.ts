/**
 * Filtros da busca de recursos. Ficam na URL (`/reservar?bloco_id=1&data=...`) para a busca
 * ser compartilhável e sobreviver ao "voltar". Os nomes são os mesmos da API.
 */
import { campusToUtcIso, isBefore, isTimeMark } from '@/domain/schedule';
import { resourceTypeLabels } from '@/domain/resource-types';
import type { ResourceListParams } from '@/lib/api/catalog.api';
import type { ResourceType } from '@/lib/api/types';

export interface ResourceSearch {
  bloco_id: number | null;
  tipo: ResourceType | null;
  caracteristicas: number[];
  capacidade_min: number | null;
  busca: string;
  /** `AAAA-MM-DD`, no fuso do campus. */
  data: string | null;
  /** `HH:mm`, no fuso do campus. */
  inicio: string | null;
  fim: string | null;
  page: number;
}

export const EMPTY_SEARCH: ResourceSearch = {
  bloco_id: null,
  tipo: null,
  caracteristicas: [],
  capacidade_min: null,
  busca: '',
  data: null,
  inicio: null,
  fim: null,
  page: 1,
};

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function positiveInt(value: string | null): number | null {
  if (value === null || !/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return parsed > 0 ? parsed : null;
}

function isResourceType(value: string | null): value is ResourceType {
  return value !== null && Object.hasOwn(resourceTypeLabels, value);
}

/** Lê a URL tolerando lixo: valor inválido vira "sem filtro". */
export function parseSearch(params: URLSearchParams): ResourceSearch {
  const tipo = params.get('tipo');
  const data = params.get('data');
  const inicio = params.get('inicio');
  const fim = params.get('fim');
  const caracteristicas = params
    .getAll('caracteristicas')
    .map(positiveInt)
    .filter((id): id is number => id !== null);
  return {
    bloco_id: positiveInt(params.get('bloco_id')),
    tipo: isResourceType(tipo) ? tipo : null,
    caracteristicas: [...new Set(caracteristicas)],
    capacidade_min: positiveInt(params.get('capacidade_min')),
    busca: params.get('busca')?.trim() ?? '',
    data: data && DATE_PATTERN.test(data) ? data : null,
    inicio: inicio && isTimeMark(inicio) ? inicio : null,
    fim: fim && isTimeMark(fim) ? fim : null,
    page: positiveInt(params.get('page')) ?? 1,
  };
}

/** Só o que difere do padrão vai para a URL. */
export function toUrlParams(search: ResourceSearch): URLSearchParams {
  const params = new URLSearchParams();
  if (search.bloco_id) params.set('bloco_id', String(search.bloco_id));
  if (search.tipo) params.set('tipo', search.tipo);
  for (const id of search.caracteristicas) params.append('caracteristicas', String(id));
  if (search.capacidade_min) params.set('capacidade_min', String(search.capacidade_min));
  if (search.busca.trim()) params.set('busca', search.busca.trim());
  if (search.data) params.set('data', search.data);
  if (search.inicio) params.set('inicio', search.inicio);
  if (search.fim) params.set('fim', search.fim);
  if (search.page > 1) params.set('page', String(search.page));
  return params;
}

/** Intervalo completo e coerente: só então a busca filtra por horário livre. */
export function hasTimeWindow(
  search: ResourceSearch,
): search is ResourceSearch & { data: string; inicio: string; fim: string } {
  return Boolean(search.data && search.inicio && search.fim && isBefore(search.inicio, search.fim));
}

export function toApiParams(search: ResourceSearch, perPage: number): ResourceListParams {
  return {
    page: search.page,
    per_page: perPage,
    ...(search.bloco_id ? { bloco_id: search.bloco_id } : {}),
    ...(search.tipo ? { tipo: search.tipo } : {}),
    ...(search.caracteristicas.length > 0 ? { caracteristicas: search.caracteristicas } : {}),
    ...(search.capacidade_min ? { capacidade_min: search.capacidade_min } : {}),
    ...(search.busca.trim() ? { busca: search.busca.trim() } : {}),
    ...(hasTimeWindow(search)
      ? {
          inicio: campusToUtcIso(search.data, search.inicio),
          fim: campusToUtcIso(search.data, search.fim),
        }
      : {}),
  };
}

/** Quantos filtros estão aplicados (o horário conta como um). */
export function activeFilterCount(search: ResourceSearch): number {
  return [
    search.bloco_id !== null,
    search.tipo !== null,
    search.caracteristicas.length > 0,
    search.capacidade_min !== null,
    search.busca.trim() !== '',
    search.data !== null || search.inicio !== null || search.fim !== null,
  ].filter(Boolean).length;
}

/** Resumo dos filtros para o Analytics (#49): o que foi usado, nunca o texto digitado. */
export function searchSummary(search: ResourceSearch) {
  return {
    tipo: search.tipo ?? 'todos',
    bloco: search.bloco_id !== null,
    caracteristicas: search.caracteristicas.length,
    capacidade: search.capacidade_min !== null,
    data: search.data !== null,
    horario: hasTimeWindow(search),
    texto: search.busca.trim() !== '',
  };
}
