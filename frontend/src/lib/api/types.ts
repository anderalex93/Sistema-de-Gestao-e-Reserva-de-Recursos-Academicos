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
export type BuildingRead = Schemas['BuildingRead'];
export type FeatureRead = Schemas['FeatureRead'];
export type ResourceType = Schemas['ResourceType'];
export type ResourceRead = Schemas['ResourceRead'];
export type SlotStatus = Schemas['SlotStatus'];
export type SlotRead = Schemas['SlotRead'];
export type AvailabilityRead = Schemas['AvailabilityRead'];
export type RulesRead = Schemas['RulesRead'];
export type ReservationCreate = Schemas['ReservationCreate'];
export type ReservationRead = Schemas['ReservationRead'];

export interface Page<Item> {
  items: Item[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}
