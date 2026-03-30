import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import type { SignOptions } from 'jsonwebtoken';
import { LlmModule } from '../llm/llm.module';
import { ChatDevTokenController } from './chat-dev-token.controller';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';

@Module({
  imports: [
    ConfigModule,
    LlmModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const expiresIn = (config.get<string>('JWT_EXPIRES_IN') ??
          '7d') as SignOptions['expiresIn'];
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
  controllers: [ChatDevTokenController],
  providers: [ChatGateway, ChatService],
})
export class ChatModule {}
