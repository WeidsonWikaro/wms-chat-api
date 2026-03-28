import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { Socket } from 'socket.io';
import { parseChatSendPayload } from './chat-validation';
import { CHAT_PROTOCOL_VERSION, CHAT_WELCOME_MESSAGE } from './chat.constants';

/** In-memory conversation ownership (Fase 1: single Nest instance). */
interface ConversationMeta {
  userId: string;
}

const CHUNK_SIZE = 64;

function nowIso(): string {
  return new Date().toISOString();
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly conversations = new Map<string, ConversationMeta>();

  /**
   * Stub “LLM” reply: deterministic streaming chunks (replace with real LLM later).
   */
  private buildAssistantText(userText: string): string {
    return (
      `[WMS Assistant] protocol v${CHAT_PROTOCOL_VERSION} (stub). ` +
      `You said: ${userText}`
    );
  }

  /**
   * Após JWT válido: cria conversa, envia saudação no mesmo formato que respostas ao `chat:send`.
   */
  sendWelcomeAfterConnect(client: Socket, userId: string): void {
    const conversationId = randomUUID();
    this.conversations.set(conversationId, { userId });
    const assistantMessageId = randomUUID();
    const sessionSentAt = nowIso();
    client.emit('chat:session', {
      conversationId,
      sentAt: sessionSentAt,
    });
    const messageSentAt = nowIso();
    const chunks = this.splitIntoChunks(CHAT_WELCOME_MESSAGE);
    for (const chunk of chunks) {
      client.emit('chat:chunk', {
        assistantMessageId,
        conversationId,
        chunk,
        sentAt: messageSentAt,
      });
    }
    client.emit('chat:complete', {
      assistantMessageId,
      conversationId,
      sentAt: messageSentAt,
    });
  }

  private splitIntoChunks(full: string): string[] {
    if (full.length === 0) {
      return [];
    }
    const chunks: string[] = [];
    for (let i = 0; i < full.length; i += CHUNK_SIZE) {
      chunks.push(full.slice(i, i + CHUNK_SIZE));
    }
    return chunks;
  }

  handleChatSend(client: Socket, body: unknown): void {
    const parsed = parseChatSendPayload(body);
    if (!parsed.ok) {
      client.emit('chat:error', {
        code: parsed.code,
        message: parsed.message,
        sentAt: nowIso(),
        ...(parsed.clientMessageId !== undefined
          ? { clientMessageId: parsed.clientMessageId }
          : {}),
      });
      return;
    }
    const {
      conversationId: incomingConvId,
      text,
      clientMessageId,
    } = parsed.payload;
    const userId = this.getUserId(client);
    if (!userId) {
      client.emit('chat:error', {
        code: 'AUTH_INVALID',
        message: 'Socket not authenticated.',
        clientMessageId,
        sentAt: nowIso(),
      });
      return;
    }
    this.logger.log(
      `chat:send received socket=${client.id} user=${userId} clientMessageId=${clientMessageId} conversationId=${incomingConvId ?? 'null(new)'} textLen=${text.length} text=${JSON.stringify(text)}`,
    );
    const assistantMessageId = randomUUID();
    try {
      let activeConversationId = incomingConvId;
      if (activeConversationId === null) {
        activeConversationId = randomUUID();
        this.conversations.set(activeConversationId, { userId });
        client.emit('chat:session', {
          conversationId: activeConversationId,
          sentAt: nowIso(),
        });
      } else {
        const meta = this.conversations.get(activeConversationId);
        if (!meta || meta.userId !== userId) {
          client.emit('chat:error', {
            code: 'CONVERSATION_NOT_FOUND',
            message:
              'Conversation not found or does not belong to this session.',
            clientMessageId,
            sentAt: nowIso(),
          });
          return;
        }
      }
      const userMessageReceivedAt = nowIso();
      client.emit('chat:message_received', {
        clientMessageId,
        conversationId: activeConversationId,
        sentAt: userMessageReceivedAt,
      });
      const full = this.buildAssistantText(text);
      const chunks = this.splitIntoChunks(full);
      const messageSentAt = nowIso();
      for (const chunk of chunks) {
        client.emit('chat:chunk', {
          assistantMessageId,
          conversationId: activeConversationId,
          chunk,
          sentAt: messageSentAt,
        });
      }
      client.emit('chat:complete', {
        assistantMessageId,
        conversationId: activeConversationId,
        sentAt: messageSentAt,
      });
    } catch (err) {
      this.logger.error(err);
      client.emit('chat:error', {
        code: 'INTERNAL_ERROR',
        message: 'Failed to process chat message.',
        clientMessageId,
        sentAt: nowIso(),
      });
    }
  }

  private getUserId(client: Socket): string | undefined {
    const data = client.data as { userId?: string };
    return typeof data.userId === 'string' ? data.userId : undefined;
  }
}
