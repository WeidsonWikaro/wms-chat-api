import { SetMetadata } from '@nestjs/common';
import { WmsUserRole } from '../../wms/shared/domain/wms-user-role.enum';

export const ROLES_KEY = 'roles';

export const Roles = (
  ...roles: WmsUserRole[]
): ReturnType<typeof SetMetadata> => SetMetadata(ROLES_KEY, roles);
