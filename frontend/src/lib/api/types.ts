/** Aliases legíveis sobre os tipos gerados do OpenAPI (`npm run gen:api`). */
import type { components } from '@/lib/api/schema';

type Schemas = components['schemas'];

export type ErrorResponse = Schemas['ErrorResponse'];
export type HealthRead = Schemas['HealthRead'];

export interface Page<Item> {
  items: Item[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}
