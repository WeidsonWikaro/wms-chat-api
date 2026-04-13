import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';
import { LlmModule } from '../llm/llm.module';
import { ChatDevTokenController } from './chat-dev-token.controller';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';

@Module({
  imports: [ConfigModule, AuthModule, LlmModule],
  controllers: [ChatDevTokenController],
  providers: [ChatGateway, ChatService],
})
export class ChatModule {}
