import type { TransferOrderStatus } from '../../shared/domain/wms.enums';

/**
 * Domain shape for TransferOrder (persisted in `transfer_orders`).
 */
export interface TransferOrder {
  readonly id: string;
  readonly referenceCode: string;
  readonly warehouseId: string | null;
  readonly status: TransferOrderStatus;
  readonly createdByUserId: string;
  readonly completedByUserId: string | null;
  readonly completedAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}
