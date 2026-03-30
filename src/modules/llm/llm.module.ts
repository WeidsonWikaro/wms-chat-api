import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CHAT_ASSISTANT } from './ports/chat-assistant.port';
import { LlmAgentService } from './services/llm-agent.service';

@Module({
  imports: [ConfigModule],
  providers: [
    LlmAgentService,
    { provide: CHAT_ASSISTANT, useExisting: LlmAgentService },
  ],
  exports: [LlmAgentService, CHAT_ASSISTANT],
})
export class LlmModule {}
