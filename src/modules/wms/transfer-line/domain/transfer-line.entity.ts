import type { TransferLineStatus } from '../../shared/domain/wms.enums';

/**
 * Domain shape for TransferLine (persisted in `transfer_lines`).
 */
export interface TransferLine {
  readonly id: string;
  readonly transferOrderId: string;
  readonly productId: string;
  readonly quantity: number;
  readonly fromLocationId: string;
  readonly toLocationId: string;
  readonly fromHandlingUnitId: string | null;
  readonly toHandlingUnitId: string | null;
  readonly status: TransferLineStatus | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}
