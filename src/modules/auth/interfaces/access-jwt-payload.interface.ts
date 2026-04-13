import type { WmsUserRole } from '../../wms/shared/domain/wms-user-role.enum';

export interface AccessJwtPayload {
  sub: string;
  role: WmsUserRole;
}
