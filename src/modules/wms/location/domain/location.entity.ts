/**
 * Domain shape for Location (persisted in `locations`).
 */
export interface Location {
  readonly id: string;
  readonly zoneId: string;
  readonly code: string;
  readonly aisle: string | null;
  readonly bay: string | null;
  readonly level: string | null;
  readonly active: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}
