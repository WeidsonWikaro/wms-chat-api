import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { BaseMessage } from '@langchain/core/messages';
import { AIMessage } from '@langchain/core/messages';
import { HumanMessage } from '@langchain/core/messages';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import type { ChatUserTurnContext } from '../interfaces/chat-user-turn-context.interface';
import type { ChatAssistantPort } from '../ports/chat-assistant.port';
import { buildWmsChatGraph } from '../graph/wms-chat.graph';
import { DEFAULT_LLM_GOOGLE_MODEL } from '../llm.constants';

@Injectable()
export class LlmAgentService implements ChatAssistantPort, OnModuleInit {
  private readonly logger = new Logger(LlmAgentService.name);
  private model!: ChatGoogleGenerativeAI;
  private graph!: ReturnType<typeof buildWmsChatGraph>;

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    const apiKey = this.config.get<string>('GOOGLE_API_KEY');
    if (!apiKey?.trim()) {
      throw new Error(
        'GOOGLE_API_KEY is required for LlmAgentService (Gemini via LangChain).',
      );
    }
    const modelName =
      this.config.get<string>('LLM_GOOGLE_MODEL') ?? DEFAULT_LLM_GOOGLE_MODEL;
    this.model = new ChatGoogleGenerativeAI({
      apiKey,
      model: modelName,
      temperature: 0.3,
    });
    this.graph = buildWmsChatGraph(this.model);
    this.logger.log(`WMS chat graph ready (model=${modelName}).`);
  }

  async generateReply(context: ChatUserTurnContext): Promise<string> {
    const text = context.parsed.payload.text;
    const result = (await this.graph.invoke({
      messages: [new HumanMessage(text)],
    })) as { messages: BaseMessage[] };
    const last = result.messages[result.messages.length - 1];
    if (last instanceof AIMessage) {
      return this.messageContentToString(last);
    }
    this.logger.warn('Last graph message was not AIMessage; coercing to string.');
    return String((last as { content?: unknown })?.content ?? '');
  }

  private messageContentToString(message: AIMessage): string {
    const { content } = message;
    if (typeof content === 'string') {
      return content;
    }
    if (Array.isArray(content)) {
      return content
        .map((part) => {
          if (typeof part === 'string') {
            return part;
          }
          if (part && typeof part === 'object' && 'text' in part) {
            return String((part as { text: string }).text);
          }
          return '';
        })
        .join('');
    }
    return String(content ?? '');
  }
}
