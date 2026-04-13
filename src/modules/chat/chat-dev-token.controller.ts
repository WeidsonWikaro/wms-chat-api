import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Post,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Public } from '../auth/decorators/public.decorator';
import { WmsUserRole } from '../wms/shared/domain/wms-user-role.enum';
import {
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class DevTokenRequestDto {
  @ApiProperty({ required: false, description: 'JWT `sub` (default dev-user)' })
  @IsOptional()
  @IsString()
  sub?: string;
}

export class DevTokenResponseDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty({ example: 'Bearer' })
  tokenType!: string;

  @ApiProperty({ example: '7d' })
  expiresIn!: string;
}

/**
 * Dev-only: issues a JWT for Socket.IO `auth.token` testing.
 * Enable with `CHAT_DEV_TOKEN_ENDPOINT=true` (never in production).
 */
@Public()
@ApiTags('chat')
@Controller('chat')
export class ChatDevTokenController {
  constructor(
    private readonly config: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('dev-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      '[Dev] Emitir JWT para testar WebSocket /chat (requer CHAT_DEV_TOKEN_ENDPOINT=true)',
  })
  @ApiBody({ type: DevTokenRequestDto, required: false })
  @ApiOkResponse({ type: DevTokenResponseDto })
  async devToken(
    @Body() body: DevTokenRequestDto,
  ): Promise<DevTokenResponseDto> {
    if (this.config.get<string>('CHAT_DEV_TOKEN_ENDPOINT') !== 'true') {
      throw new NotFoundException();
    }
    const sub = body?.sub?.trim() || 'dev-user';
    const accessToken = await this.jwtService.signAsync({
      sub,
      role: WmsUserRole.ADMIN,
    });
    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: '7d',
    };
  }
}
