import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { BaseMessage } from '@langchain/core/messages';
import {
  AIMessage,
  HumanMessage,
  isToolMessage,
} from '@langchain/core/messages';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HandlingUnitsService } from '../../wms/handling-unit/http/handling-units.service';
import { LocationsService } from '../../wms/location/http/locations.service';
import { ProductsService } from '../../wms/products/http/products.service';
import { WarehousesService } from '../../wms/warehouse/http/warehouses.service';
import { WmsUsersService } from '../../wms/wms-user/http/wms-users.service';
import { ZonesService } from '../../wms/zone/http/zones.service';
import { RagSearchService } from '../../rag/services/rag-search.service';
import type { ChatUserTurnContext } from '../interfaces/chat-user-turn-context.interface';
import type {
  ChatAssistantPort,
  StreamReplyOptions,
} from '../ports/chat-assistant.port';
import { buildWmsChatGraph } from '../graph/wms-chat.graph';
import {
  DEFAULT_LLM_GOOGLE_MODEL,
  DEFAULT_LLM_MAX_SAME_TOOL_STREAK,
  DEFAULT_LLM_MAX_TOOL_ROUNDS,
  DEFAULT_LLM_MODEL_CALL_TIMEOUT_MS,
  DEFAULT_LLM_RECURSION_LIMIT,
  DEFAULT_LLM_TOOL_NODE_TIMEOUT_MS,
  DEFAULT_LLM_TURN_TIMEOUT_MS,
  WMS_CHAT_TURN_TIMEOUT_MESSAGE,
} from '../llm.constants';
import { createProductTools } from '../tools/create-product-tools';
import { createRagTools } from '../../rag/tools/create-rag-tools';
import { createWmsLookupTools } from '../tools/create-wms-lookup-tools';

function parsePositiveInt(
  raw: string | number | undefined | null,
  fallback: number,
): number {
  if (raw === undefined || raw === null || raw === '') {
    return fallback;
  }
  const n = typeof raw === 'number' ? raw : parseInt(String(raw), 10);
  if (!Number.isFinite(n) || n <= 0) {
    return fallback;
  }
  return n;
}

function parseOptionalPositiveInt(
  raw: string | number | undefined | null,
): number | undefined {
  if (raw === undefined || raw === null || raw === '') {
    return undefined;
  }
  const n = typeof raw === 'number' ? raw : parseInt(String(raw), 10);
  if (!Number.isFinite(n) || n <= 0) {
    return undefined;
  }
  return n;
}

function isTurnTimeoutError(err: unknown): boolean {
  if (err === null || err === undefined) {
    return false;
  }
  if (err instanceof Error) {
    if (err.name === 'AbortError' || err.name === 'TimeoutError') {
      return true;
    }
    const code = (err as NodeJS.ErrnoException).code;
    if (code === 'ABORT_ERR') {
      return true;
    }
  }
  if (
    typeof err === 'object' &&
    err !== null &&
    'name' in err &&
    (err as { name: string }).name === 'TimeoutError'
  ) {
    return true;
  }
  return false;
}

const STREAM_NODES = new Set<string>(['agent', 'forceEnd']);

@Injectable()
export class LlmAgentService implements ChatAssistantPort, OnModuleInit {
  private readonly logger = new Logger(LlmAgentService.name);
  private model!: ChatGoogleGenerativeAI;
  private graph!: ReturnType<typeof buildWmsChatGraph>;
  private turnTimeoutMs!: number;
  private recursionLimit!: number;

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
    const rawModelTimeout = this.config.get<string | number>(
      'LLM_MODEL_CALL_TIMEOUT_MS',
    );
    const modelCallTimeoutMs =
      rawModelTimeout === '0' || rawModelTimeout === 0
        ? undefined
        : (parseOptionalPositiveInt(rawModelTimeout) ??
          DEFAULT_LLM_MODEL_CALL_TIMEOUT_MS);
    const rawToolTimeout = this.config.get<string | number>(
      'LLM_TOOL_NODE_TIMEOUT_MS',
    );
    const toolNodeTimeoutMs =
      rawToolTimeout === '0' || rawToolTimeout === 0
        ? undefined
        : (parseOptionalPositiveInt(rawToolTimeout) ??
          DEFAULT_LLM_TOOL_NODE_TIMEOUT_MS);
    this.turnTimeoutMs = parsePositiveInt(
      this.config.get<string | number>('LLM_TURN_TIMEOUT_MS'),
      DEFAULT_LLM_TURN_TIMEOUT_MS,
    );
    const maxToolRounds = Math.max(
      1,
      parsePositiveInt(
        this.config.get<string | number>('LLM_MAX_TOOL_ROUNDS'),
        DEFAULT_LLM_MAX_TOOL_ROUNDS,
      ),
    );
    const maxSameToolStreak = Math.max(
      2,
      parsePositiveInt(
        this.config.get<string | number>('LLM_MAX_SAME_TOOL_STREAK'),
        DEFAULT_LLM_MAX_SAME_TOOL_STREAK,
      ),
    );
    this.recursionLimit = Math.max(
      24,
      parsePositiveInt(
        this.config.get<string | number>('LLM_RECURSION_LIMIT'),
        Math.max(DEFAULT_LLM_RECURSION_LIMIT, maxToolRounds * 4 + 12),
      ),
    );
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
    this.graph = buildWmsChatGraph(this.model, allTools, {
      limits: { maxToolRounds, maxSameToolStreak },
      modelCallTimeoutMs,
      toolNodeTimeoutMs,
    });
    this.logger.log(
      `WMS chat graph ready (model=${modelName}, tools=${allTools.length}, turnTimeoutMs=${this.turnTimeoutMs}, recursionLimit=${this.recursionLimit}, maxToolRounds=${maxToolRounds}, maxSameToolStreak=${maxSameToolStreak}).`,
    );
  }

  async generateReply(context: ChatUserTurnContext): Promise<string> {
    let full = '';
    for await (const delta of this.streamReply(context)) {
      full += delta;
    }
    return full;
  }

  async *streamReply(
    context: ChatUserTurnContext,
    options?: StreamReplyOptions,
  ): AsyncGenerator<string, void, undefined> {
    const text = context.parsed.payload.text;
    const clientSignal = options?.signal;
    const controller = new AbortController();
    const onClientAbort = (): void => {
      controller.abort();
    };
    if (clientSignal !== undefined && !clientSignal.aborted) {
      clientSignal.addEventListener('abort', onClientAbort, { once: true });
    }
    if (clientSignal?.aborted === true) {
      controller.abort();
    }
    const turnTimer = setTimeout(() => {
      controller.abort();
    }, this.turnTimeoutMs);
    const input = {
      messages: [new HumanMessage(text)],
      toolRoundCount: 0,
      lastToolCallsSignature: null,
      sameToolCallsStreak: 0,
      haltReason: null,
    };
    try {
      const stream = await this.graph.stream(input, {
        streamMode: 'messages',
        recursionLimit: this.recursionLimit,
        signal: controller.signal,
      });
      for await (const item of stream) {
        if (controller.signal.aborted) {
          break;
        }
        const pair = item as unknown;
        if (!Array.isArray(pair) || pair.length !== 2) {
          continue;
        }
        const [msg, rawMeta] = pair as [BaseMessage, Record<string, unknown>];
        if (isToolMessage(msg)) {
          continue;
        }
        const node = rawMeta.langgraph_node;
        if (typeof node === 'string' && !STREAM_NODES.has(node)) {
          continue;
        }
        const piece = this.messageBodyToText(msg);
        if (piece.length > 0) {
          yield piece;
        }
      }
    } catch (err) {
      if (clientSignal?.aborted === true) {
        return;
      }
      if (isTurnTimeoutError(err)) {
        this.logger.warn(
          `Turn aborted by timeout after ${this.turnTimeoutMs}ms (socket user=${context.userId}).`,
        );
        yield WMS_CHAT_TURN_TIMEOUT_MESSAGE;
        return;
      }
      throw err;
    } finally {
      clearTimeout(turnTimer);
      if (clientSignal !== undefined) {
        clientSignal.removeEventListener('abort', onClientAbort);
      }
    }
  }

  /**
   * LangChain uses `_getType() === "ai"` for both {@link AIMessage} and {@link AIMessageChunk}
   * (chunks are not `instanceof AIMessage`).
   */
  private messageBodyToText(message: BaseMessage): string {
    if (message._getType() !== 'ai') {
      return '';
    }
    const { content } = message as AIMessage;
    return this.messageContentBlocksToString(content);
  }

  private messageContentBlocksToString(content: AIMessage['content']): string {
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
