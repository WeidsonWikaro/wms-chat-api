import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ProductsModule } from '../wms/products/products.module';
import { CHAT_ASSISTANT } from './ports/chat-assistant.port';
import { LlmAgentService } from './services/llm-agent.service';

@Module({
  imports: [ConfigModule, ProductsModule],
  providers: [
    LlmAgentService,
    { provide: CHAT_ASSISTANT, useExisting: LlmAgentService },
  ],
  exports: [LlmAgentService, CHAT_ASSISTANT],
})
export class LlmModule {}
