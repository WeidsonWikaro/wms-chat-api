/**
 * Domain shape for InventoryBalance (persisted in `inventory_balances`).
 */
export interface InventoryBalance {
  readonly id: string;
  readonly productId: string;
  readonly locationId: string;
  readonly handlingUnitId: string | null;
  readonly quantityOnHand: number;
  readonly quantityReserved: number;
  readonly updatedAt: string;
}
