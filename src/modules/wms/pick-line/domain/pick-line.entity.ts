import type { PickLineStatus } from '../../shared/domain/wms.enums';

/**
 * Domain shape for PickLine (persisted in `pick_lines`).
 */
export interface PickLine {
  readonly id: string;
  readonly pickOrderId: string;
  readonly productId: string;
  readonly quantityOrdered: number;
  readonly quantityPicked: number;
  readonly sourceLocationId: string | null;
  readonly status: PickLineStatus;
  readonly pickedByUserId: string | null;
  readonly pickedAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}
