import type { HttpClient } from '@/lib/api/http-client';
import type {
  BuildingAdminRead,
  BuildingCreate,
  FeatureAdminRead,
  FeatureCreate,
  Page,
  RemovalRead,
  ResourceAdminRead,
  ResourceCreate,
  ResourceType,
} from '@/lib/api/types';

/** Parâmetros de `GET /admin/recursos`. Sem `ativo`, lista ativos e desativados. */
export interface AdminResourceListParams {
  page: number;
  per_page: number;
  busca?: string;
  bloco_id?: number;
  tipo?: ResourceType;
  ativo?: boolean;
}

/**
 * Manutenção do catálogo (#27). `remove` exclui o que não tem histórico e desativa o resto;
 * com reservas futuras responde `409 RESERVAS_FUTURAS` até ser chamado com `force`.
 */
export class AdminCatalogApi {
  readonly #http: HttpClient;

  constructor(http: HttpClient) {
    this.#http = http;
  }

  listResources(params: AdminResourceListParams): Promise<Page<ResourceAdminRead>> {
    return this.#http.get<Page<ResourceAdminRead>>('/admin/recursos', { params });
  }

  createResource(data: ResourceCreate): Promise<ResourceAdminRead> {
    return this.#http.post<ResourceAdminRead>('/admin/recursos', data);
  }

  updateResource(id: number, data: ResourceCreate): Promise<ResourceAdminRead> {
    return this.#http.put<ResourceAdminRead>(`/admin/recursos/${id}`, data);
  }

  removeResource(id: number, force = false): Promise<RemovalRead> {
    return this.#http.delete<RemovalRead>(`/admin/recursos/${id}`, forceParams(force));
  }

  getResource(id: number): Promise<ResourceAdminRead> {
    return this.#http.get<ResourceAdminRead>(`/admin/recursos/${id}`);
  }

  /** Novo código para o QR da porta: os QRs impressos antes deixam de valer (#43). */
  renewCheckinToken(id: number): Promise<ResourceAdminRead> {
    return this.#http.post<ResourceAdminRead>(`/admin/recursos/${id}/checkin/renovar`);
  }

  reactivateResource(id: number): Promise<ResourceAdminRead> {
    return this.#http.post<ResourceAdminRead>(`/admin/recursos/${id}/reativar`);
  }

  listBuildings(): Promise<BuildingAdminRead[]> {
    return this.#http.get<BuildingAdminRead[]>('/admin/blocos');
  }

  createBuilding(data: BuildingCreate): Promise<BuildingAdminRead> {
    return this.#http.post<BuildingAdminRead>('/admin/blocos', data);
  }

  updateBuilding(id: number, data: BuildingCreate): Promise<BuildingAdminRead> {
    return this.#http.put<BuildingAdminRead>(`/admin/blocos/${id}`, data);
  }

  removeBuilding(id: number, force = false): Promise<RemovalRead> {
    return this.#http.delete<RemovalRead>(`/admin/blocos/${id}`, forceParams(force));
  }

  reactivateBuilding(id: number): Promise<BuildingAdminRead> {
    return this.#http.post<BuildingAdminRead>(`/admin/blocos/${id}/reativar`);
  }

  listFeatures(): Promise<FeatureAdminRead[]> {
    return this.#http.get<FeatureAdminRead[]>('/admin/caracteristicas');
  }

  createFeature(data: FeatureCreate): Promise<FeatureAdminRead> {
    return this.#http.post<FeatureAdminRead>('/admin/caracteristicas', data);
  }

  updateFeature(id: number, data: FeatureCreate): Promise<FeatureAdminRead> {
    return this.#http.put<FeatureAdminRead>(`/admin/caracteristicas/${id}`, data);
  }

  removeFeature(id: number): Promise<void> {
    return this.#http.delete<void>(`/admin/caracteristicas/${id}`);
  }
}

function forceParams(force: boolean) {
  return force ? { params: { forcar: true } } : undefined;
}
