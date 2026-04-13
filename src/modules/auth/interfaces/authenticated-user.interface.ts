import type { WmsUserRole } from '../../wms/shared/domain/wms-user-role.enum';

export interface AuthenticatedUser {
  userId: string;
  role: WmsUserRole;
}
