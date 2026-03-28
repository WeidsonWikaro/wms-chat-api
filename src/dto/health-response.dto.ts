import { ApiProperty } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty({
    example: 'ok',
    description: 'Liveness flag',
  })
  status!: string;

  @ApiProperty({
    example: 'chat-api',
    description: 'Service name',
  })
  service!: string;

  @ApiProperty({
    format: 'date-time',
    example: '2026-03-27T14:30:00.000Z',
    description: 'Server time (ISO 8601)',
  })
  timestamp!: string;
}
