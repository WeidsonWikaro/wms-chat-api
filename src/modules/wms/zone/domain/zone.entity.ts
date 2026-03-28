import type { ZoneType } from '../../shared/domain/wms.enums';

/**
 * Domain shape for Zone (persisted in `zones`).
 */
export interface Zone {
  readonly id: string;
  readonly warehouseId: string;
  readonly code: string;
  readonly name: string;
  readonly zoneType: ZoneType;
  readonly createdAt: string;
  readonly updatedAt: string;
}
