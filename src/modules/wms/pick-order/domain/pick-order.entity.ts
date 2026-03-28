import type { PickOrderStatus } from '../../shared/domain/wms.enums';

/**
 * Domain shape for PickOrder (persisted in `pick_orders`).
 */
export interface PickOrder {
  readonly id: string;
  readonly orderNumber: string;
  readonly warehouseId: string;
  readonly status: PickOrderStatus;
  readonly priority: number | null;
  readonly createdByUserId: string;
  readonly releasedByUserId: string | null;
  readonly releasedAt: string | null;
  readonly completedByUserId: string | null;
  readonly completedAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}
