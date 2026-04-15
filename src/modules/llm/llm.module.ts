import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RagModule } from '../rag/rag.module';
import { WmsModule } from '../wms/wms.module';
import { CHAT_ASSISTANT } from './ports/chat-assistant.port';
import { LlmAgentService } from './services/llm-agent.service';
import { PendingInventoryAdjustmentStore } from './services/pending-inventory-adjustment.store';

@Module({
  imports: [ConfigModule, WmsModule, RagModule],
  providers: [
    PendingInventoryAdjustmentStore,
    LlmAgentService,
    { provide: CHAT_ASSISTANT, useExisting: LlmAgentService },
  ],
  exports: [LlmAgentService, CHAT_ASSISTANT],
})
export class LlmModule {}
