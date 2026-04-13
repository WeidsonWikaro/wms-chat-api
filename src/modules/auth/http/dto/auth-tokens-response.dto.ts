import { ApiProperty } from '@nestjs/swagger';

export class AuthTokensResponseDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  refreshToken!: string;

  @ApiProperty({ example: 'Bearer' })
  tokenType!: string;

  @ApiProperty({
    example: '5m',
    description:
      'Tempo de vida do access token (valor de JWT_ACCESS_EXPIRES_IN)',
  })
  accessExpiresIn!: string;

  @ApiProperty({
    example: '10m',
    description:
      'Tempo de vida do refresh token (valor de JWT_REFRESH_EXPIRES_IN)',
  })
  refreshExpiresIn!: string;
}
