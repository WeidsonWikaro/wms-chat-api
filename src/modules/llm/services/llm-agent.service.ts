import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { BaseMessage } from '@langchain/core/messages';
import { AIMessage } from '@langchain/core/messages';
import { HumanMessage } from '@langchain/core/messages';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HandlingUnitsService } from '../../wms/handling-unit/http/handling-units.service';
import { LocationsService } from '../../wms/location/http/locations.service';
import { ProductsService } from '../../wms/products/http/products.service';
import { WarehousesService } from '../../wms/warehouse/http/warehouses.service';
import { WmsUsersService } from '../../wms/wms-user/http/wms-users.service';
import { ZonesService } from '../../wms/zone/http/zones.service';
import { RagSearchService } from '../../rag/services/rag-search.service';
import type { ChatUserTurnContext } from '../interfaces/chat-user-turn-context.interface';
import type { ChatAssistantPort } from '../ports/chat-assistant.port';
import { buildWmsChatGraph } from '../graph/wms-chat.graph';
import { DEFAULT_LLM_GOOGLE_MODEL } from '../llm.constants';
import { createProductTools } from '../tools/create-product-tools';
import { createRagTools } from '../../rag/tools/create-rag-tools';
import { createWmsLookupTools } from '../tools/create-wms-lookup-tools';

@Injectable()
export class LlmAgentService implements ChatAssistantPort, OnModuleInit {
  private readonly logger = new Logger(LlmAgentService.name);
  private model!: ChatGoogleGenerativeAI;
  private graph!: ReturnType<typeof buildWmsChatGraph>;

  constructor(
    private readonly config: ConfigService,
    private readonly productsService: ProductsService,
    private readonly wmsUsersService: WmsUsersService,
    private readonly warehousesService: WarehousesService,
    private readonly zonesService: ZonesService,
    private readonly locationsService: LocationsService,
    private readonly handlingUnitsService: HandlingUnitsService,
    private readonly ragSearchService: RagSearchService,
  ) {}

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
    const productTools = createProductTools(this.productsService);
    const wmsLookupTools = createWmsLookupTools({
      wmsUsersService: this.wmsUsersService,
      warehousesService: this.warehousesService,
      zonesService: this.zonesService,
      locationsService: this.locationsService,
      handlingUnitsService: this.handlingUnitsService,
    });
    const ragTools = createRagTools(this.ragSearchService);
    const allTools = [...productTools, ...wmsLookupTools, ...ragTools];
    this.graph = buildWmsChatGraph(this.model, allTools);
    this.logger.log(
      `WMS chat graph ready (model=${modelName}, tools=${allTools.length}).`,
    );
  }

  async generateReply(context: ChatUserTurnContext): Promise<string> {
    const text = context.parsed.payload.text;
    const result = (await this.graph.invoke(
      { messages: [new HumanMessage(text)] },
      { recursionLimit: 12 },
    )) as { messages: BaseMessage[] };
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
