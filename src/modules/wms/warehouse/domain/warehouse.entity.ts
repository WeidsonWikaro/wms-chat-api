/**
 * Domain shape for Warehouse (persisted in `warehouses`).
 */
export interface Warehouse {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly active: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}
