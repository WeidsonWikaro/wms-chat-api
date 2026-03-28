import type {
  HandlingUnitStatus,
  HandlingUnitType,
} from '../../shared/domain/wms.enums';

/**
 * Domain shape for HandlingUnit (persisted in `handling_units`).
 */
export interface HandlingUnit {
  readonly id: string;
  readonly code: string;
  readonly type: HandlingUnitType;
  readonly currentLocationId: string | null;
  readonly status: HandlingUnitStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
}
