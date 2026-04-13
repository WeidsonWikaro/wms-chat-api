import type { WmsUserRole } from '../../shared/domain/wms-user-role.enum';

/**
 * Domain shape for WMS operator user (persisted in `wms_users`).
 */
export interface WmsUser {
  readonly id: string;
  readonly code: string;
  readonly displayName: string;
  readonly role: WmsUserRole;
  readonly active: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}
