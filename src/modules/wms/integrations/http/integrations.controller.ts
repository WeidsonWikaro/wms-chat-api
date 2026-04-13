import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { WmsUserRole } from '../../shared/domain/wms-user-role.enum';
import type { IntegrationsStatusResponseDto } from './integrations.service';
import { IntegrationsService } from './integrations.service';

@ApiTags('integrations')
@ApiBearerAuth('access-token')
@Roles(WmsUserRole.ADMIN)
@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly service: IntegrationsService) {}

  @Get('status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Status das integrações externas (stub — ERP, transporte, etiquetas, leitores)',
  })
  @ApiOkResponse({ description: 'Estado resumido das integrações' })
  getStatus(): IntegrationsStatusResponseDto {
    return this.service.getStatus();
  }
}
