import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { WmsUserOrmEntity } from '../../wms/wms-user/persistence/wms-user.orm-entity';
import type { AccessJwtPayload } from '../interfaces/access-jwt-payload.interface';
import type { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    @InjectRepository(WmsUserOrmEntity)
    private readonly wmsUsers: Repository<WmsUserOrmEntity>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>(
        'JWT_SECRET',
        'dev-secret-change-me-chat-api',
      ),
    });
  }

  async validate(payload: AccessJwtPayload): Promise<AuthenticatedUser> {
    if (typeof payload.sub !== 'string' || payload.sub.length === 0) {
      throw new UnauthorizedException();
    }
    const user = await this.wmsUsers.findOne({
      where: { id: payload.sub },
    });
    if (user === null || !user.active) {
      throw new UnauthorizedException();
    }
    if (user.role !== payload.role) {
      throw new UnauthorizedException();
    }
    return { userId: user.id, role: user.role };
  }
}
