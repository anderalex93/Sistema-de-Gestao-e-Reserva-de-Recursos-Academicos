/** Aliases legíveis sobre os tipos gerados do OpenAPI (`npm run gen:api`). */
import type { components } from '@/lib/api/schema';

type Schemas = components['schemas'];

export type ErrorResponse = Schemas['ErrorResponse'];
export type HealthRead = Schemas['HealthRead'];
export type UserRole = Schemas['UserRole'];
export type UserRead = Schemas['UserRead'];
export type UserSignup = Schemas['UserSignup'];
export type UserAdminCreate = Schemas['UserAdminCreate'];
export type UserAdminUpdate = Schemas['UserAdminUpdate'];
export type MyDataExport = Schemas['MyDataExport'];
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
export type CampusSettingsRead = Schemas['CampusSettingsRead'];
export type CampusSettingsUpdate = Schemas['CampusSettingsUpdate'];
export type ReservationCreate = Schemas['ReservationCreate'];
export type ReservationRead = Schemas['ReservationRead'];
export type BoardRead = Schemas['BoardRead'];
export type ReceiptRead = Schemas['ReceiptRead'];
export type MyReservationRead = Schemas['MyReservationRead'];
export type ReservationScope = Schemas['ReservationScope'];
export type ReservationStatus = Schemas['ReservationStatus'];
export type BuildingAdminRead = Schemas['BuildingAdminRead'];
export type BuildingCreate = Schemas['BuildingCreate'];
export type FeatureAdminRead = Schemas['FeatureAdminRead'];
export type FeatureCreate = Schemas['FeatureCreate'];
export type ResourceAdminRead = Schemas['ResourceAdminRead'];
export type ResourceCreate = Schemas['ResourceCreate'];
export type RemovalRead = Schemas['RemovalRead'];
export type AdminReservationRead = Schemas['AdminReservationRead'];
export type CheckinSituation = Schemas['CheckinSituation'];
export type CheckinStatusRead = Schemas['CheckinStatusRead'];
export type OccupancyRead = Schemas['OccupancyRead'];
export type HeatmapCellRead = Schemas['HeatmapCellRead'];
export type ResourceOccupancyRead = Schemas['ResourceOccupancyRead'];

export interface Page<Item> {
  items: Item[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}
