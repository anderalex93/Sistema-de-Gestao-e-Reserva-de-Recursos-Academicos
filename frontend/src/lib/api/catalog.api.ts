import type { HttpClient } from '@/lib/api/http-client';
import type { BuildingRead, FeatureRead, Page, ResourceRead } from '@/lib/api/types';

export interface ResourceListParams {
  page: number;
  per_page: number;
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
}
