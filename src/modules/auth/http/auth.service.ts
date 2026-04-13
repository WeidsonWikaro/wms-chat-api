import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import type { SignOptions } from 'jsonwebtoken';
import { Repository } from 'typeorm';
import { WmsUserOrmEntity } from '../../wms/wms-user/persistence/wms-user.orm-entity';
import type { AccessJwtPayload } from '../interfaces/access-jwt-payload.interface';
import type { RefreshJwtPayload } from '../interfaces/refresh-jwt-payload.interface';
import { AuthRefreshTokenOrmEntity } from '../persistence/auth-refresh-token.orm-entity';
import type { AuthTokensResponseDto } from './dto/auth-tokens-response.dto';
import type { LoginRequestDto } from './dto/login-request.dto';
import type { RefreshRequestDto } from './dto/refresh-request.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly config: ConfigService,
    private readonly jwtService: JwtService,
    @InjectRepository(WmsUserOrmEntity)
    private readonly wmsUsers: Repository<WmsUserOrmEntity>,
    @InjectRepository(AuthRefreshTokenOrmEntity)
    private readonly refreshTokens: Repository<AuthRefreshTokenOrmEntity>,
  ) {}

  async login(dto: LoginRequestDto): Promise<AuthTokensResponseDto> {
    const code = dto.code.trim();
    const user = await this.wmsUsers.findOne({ where: { code } });
    if (user === null) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }
    if (!user.active) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }
    if (user.passwordHash === null || user.passwordHash.length === 0) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }
    const passwordOk = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordOk) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }
    return this.issueTokenPair(user);
  }

  async refresh(dto: RefreshRequestDto): Promise<AuthTokensResponseDto> {
    const refreshSecret = this.getRefreshSecret();
    let payload: RefreshJwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<RefreshJwtPayload>(
        dto.refreshToken,
        { secret: refreshSecret },
      );
    } catch {
      throw new UnauthorizedException('Refresh token inválido ou expirado.');
    }
    if (payload.typ !== 'refresh') {
      throw new UnauthorizedException('Refresh token inválido ou expirado.');
    }
    const row = await this.refreshTokens.findOne({
      where: { jti: payload.jti, user: { id: payload.sub } },
      relations: ['user'],
    });
    if (
      row === null ||
      row.revokedAt !== null ||
      row.expiresAt.getTime() <= Date.now()
    ) {
      throw new UnauthorizedException('Refresh token inválido ou expirado.');
    }
    const user = await this.wmsUsers.findOne({ where: { id: payload.sub } });
    if (user === null || !user.active) {
      throw new UnauthorizedException('Refresh token inválido ou expirado.');
    }
    row.revokedAt = new Date();
    await this.refreshTokens.save(row);
    return this.issueTokenPair(user);
  }

  async logout(dto: RefreshRequestDto): Promise<void> {
    const refreshSecret = this.getRefreshSecret();
    let payload: RefreshJwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<RefreshJwtPayload>(
        dto.refreshToken,
        { secret: refreshSecret },
      );
    } catch {
      return;
    }
    if (payload.typ !== 'refresh') {
      return;
    }
    await this.refreshTokens
      .createQueryBuilder()
      .update(AuthRefreshTokenOrmEntity)
      .set({ revokedAt: new Date() })
      .where('jti = :jti AND "userId" = :userId', {
        jti: payload.jti,
        userId: payload.sub,
      })
      .execute();
  }

  private getRefreshSecret(): string {
    const explicit = this.config.get<string>('JWT_REFRESH_SECRET');
    if (explicit !== undefined && explicit.trim().length > 0) {
      return explicit.trim();
    }
    return this.config.get<string>(
      'JWT_SECRET',
      'dev-secret-change-me-chat-api',
    );
  }

  private getAccessExpiresIn(): SignOptions['expiresIn'] {
    const raw = this.config.get<string>('JWT_ACCESS_EXPIRES_IN') ?? '5m';
    return raw as SignOptions['expiresIn'];
  }

  private getRefreshExpiresIn(): SignOptions['expiresIn'] {
    // TEMP teste: 10m — pedir "Voltar" para repor defeito `7d`.
    const raw = this.config.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '10m';
    return raw as SignOptions['expiresIn'];
  }

  private async issueTokenPair(
    user: WmsUserOrmEntity,
  ): Promise<AuthTokensResponseDto> {
    const accessExpiresIn = this.getAccessExpiresIn();
    const refreshExpiresIn = this.getRefreshExpiresIn();
    const accessPayload: AccessJwtPayload = {
      sub: user.id,
      role: user.role,
    };
    const accessToken = await this.jwtService.signAsync(accessPayload, {
      expiresIn: accessExpiresIn,
    });
    const jti = randomUUID();
    const refreshSecret = this.getRefreshSecret();
    const refreshToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        jti,
        typ: 'refresh' as const,
      },
      {
        secret: refreshSecret,
        expiresIn: refreshExpiresIn,
      },
    );

    const decodedUnknown: unknown = this.jwtService.decode(refreshToken);
    let expiresAt: Date;
    if (
      decodedUnknown !== null &&
      typeof decodedUnknown === 'object' &&
      'exp' in decodedUnknown &&
      typeof (decodedUnknown as { exp: unknown }).exp === 'number'
    ) {
      const expSec = (decodedUnknown as { exp: number }).exp;
      expiresAt = new Date(expSec * 1000);
    } else {
      expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }
    await this.refreshTokens.save({
      jti,
      user: { id: user.id } as WmsUserOrmEntity,
      expiresAt,
      revokedAt: null,
    } as AuthRefreshTokenOrmEntity);
    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      accessExpiresIn: String(accessExpiresIn),
      refreshExpiresIn: String(refreshExpiresIn),
    };
  }
}
