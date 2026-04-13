import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBody,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '../decorators/public.decorator';
import { AuthService } from './auth.service';
import { AuthTokensResponseDto } from './dto/auth-tokens-response.dto';
import { LoginRequestDto } from './dto/login-request.dto';
import { RefreshRequestDto } from './dto/refresh-request.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login com código WMS e palavra-passe' })
  @ApiBody({ type: LoginRequestDto })
  @ApiOkResponse({ type: AuthTokensResponseDto })
  async login(@Body() body: LoginRequestDto): Promise<AuthTokensResponseDto> {
    return this.authService.login(body);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Renovar access token (rotação do refresh token)',
    description:
      'Cada chamada revoga o refresh usado e devolve um par novo. Guarde o novo refresh no cliente.',
  })
  @ApiBody({ type: RefreshRequestDto })
  @ApiOkResponse({ type: AuthTokensResponseDto })
  async refresh(
    @Body() body: RefreshRequestDto,
  ): Promise<AuthTokensResponseDto> {
    return this.authService.refresh(body);
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Revogar refresh token atual',
    description:
      'Idempotente: tokens inválidos não devolvem erro (evita enumeração).',
  })
  @ApiBody({ type: RefreshRequestDto })
  @ApiNoContentResponse()
  async logout(@Body() body: RefreshRequestDto): Promise<void> {
    await this.authService.logout(body);
  }
}
