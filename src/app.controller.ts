import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from './modules/auth/decorators/public.decorator';
import { HealthResponseDto } from './dto/health-response.dto';

@ApiTags('health')
@Controller()
export class AppController {
  @Public()
  @Get('health')
  @ApiOperation({
    summary: 'Health check',
    description:
      'No request body. Returns JSON with status, service name, and timestamp.',
  })
  @ApiOkResponse({
    type: HealthResponseDto,
    example: {
      status: 'ok',
      service: 'chat-api',
      timestamp: '2026-03-27T14:30:00.000Z',
    },
  })
  getHealth(): { status: string; service: string; timestamp: string } {
    return {
      status: 'ok',
      service: 'chat-api',
      timestamp: new Date().toISOString(),
    };
  }
}
