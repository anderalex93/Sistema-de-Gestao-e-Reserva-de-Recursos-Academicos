/** Aliases legíveis sobre os tipos gerados do OpenAPI (`npm run gen:api`). */
import type { components } from '@/lib/api/schema';

type Schemas = components['schemas'];

export type ErrorResponse = Schemas['ErrorResponse'];
export type HealthRead = Schemas['HealthRead'];
export type UserRole = Schemas['UserRole'];
export type UserRead = Schemas['UserRead'];
export type UserSignup = Schemas['UserSignup'];
export type UserAdminCreate = Schemas['UserAdminCreate'];
export type LoginRequest = Schemas['LoginRequest'];
export type TokenRead = Schemas['TokenRead'];

export interface Page<Item> {
  items: Item[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}
