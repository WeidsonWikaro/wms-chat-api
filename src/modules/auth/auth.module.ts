import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import type { SignOptions } from 'jsonwebtoken';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WmsUserOrmEntity } from '../wms/wms-user/persistence/wms-user.orm-entity';
import { AuthController } from './http/auth.controller';
import { AuthService } from './http/auth.service';
import { AuthRefreshTokenOrmEntity } from './persistence/auth-refresh-token.orm-entity';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([WmsUserOrmEntity, AuthRefreshTokenOrmEntity]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const expiresIn = (config.get<string>('JWT_ACCESS_EXPIRES_IN') ??
          '5m') as SignOptions['expiresIn'];
        return {
          secret: config.get<string>(
            'JWT_SECRET',
            'dev-secret-change-me-chat-api',
          ),
          signOptions: {
            expiresIn,
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard, RolesGuard],
  exports: [AuthService, JwtModule, PassportModule, JwtAuthGuard, RolesGuard],
})
export class AuthModule {}
