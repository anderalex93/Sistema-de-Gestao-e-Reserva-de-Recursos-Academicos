import type { HttpClient } from '@/lib/api/http-client';
import type {
  AvailabilityRead,
  BuildingRead,
  FeatureRead,
  Page,
  ResourceRead,
  ResourceType,
} from '@/lib/api/types';

/** Parâmetros de `GET /recursos`. `inicio` e `fim` em ISO UTC, sempre juntos. */
export interface ResourceListParams {
  page: number;
  per_page: number;
  bloco_id?: number;
  tipo?: ResourceType;
  caracteristicas?: number[];
  capacidade_min?: number;
  busca?: string;
  inicio?: string;
  fim?: string;
}

export class CatalogApi {
  readonly #http: HttpClient;

  constructor(http: HttpClient) {
    this.#http = http;
  }

  listBuildings(): Promise<BuildingRead[]> {
    return this.#http.get<BuildingRead[]>('/blocos');
  }

  listFeatures(): Promise<FeatureRead[]> {
    return this.#http.get<FeatureRead[]>('/caracteristicas');
  }

  listResources(params: ResourceListParams): Promise<Page<ResourceRead>> {
    return this.#http.get<Page<ResourceRead>>('/recursos', { params });
  }

  getResource(id: number): Promise<ResourceRead> {
    return this.#http.get<ResourceRead>(`/recursos/${id}`);
  }

  /** Grade do dia `data` (AAAA-MM-DD, fuso do campus). */
  getAvailability(id: number, data: string): Promise<AvailabilityRead> {
    return this.#http.get<AvailabilityRead>(`/recursos/${id}/disponibilidade`, {
      params: { data },
    });
  }
}
