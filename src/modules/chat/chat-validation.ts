import { CHAT_MAX_TEXT_LENGTH } from './chat.constants';

const UUID_V4_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuidV4(value: string): boolean {
  return UUID_V4_RE.test(value);
}

export interface ChatSendPayload {
  conversationId: string | null;
  text: string;
  clientMessageId: string;
}

export type ChatSendParseResult =
  | { ok: true; payload: ChatSendPayload }
  | { ok: false; code: string; message: string; clientMessageId?: string };

/**
 * Validates `chat:send` body (object after Socket.IO deserialization).
 */
export function parseChatSendPayload(body: unknown): ChatSendParseResult {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return {
      ok: false,
      code: 'VALIDATION_ERROR',
      message: 'Payload must be a JSON object.',
    };
  }
  const o = body as Record<string, unknown>;
  const conversationIdRaw = o.conversationId;
  let conversationId: string | null;
  if (conversationIdRaw === null) {
    conversationId = null;
  } else if (typeof conversationIdRaw === 'string') {
    if (!isUuidV4(conversationIdRaw)) {
      return {
        ok: false,
        code: 'VALIDATION_ERROR',
        message: 'conversationId must be null or a UUID v4 string.',
      };
    }
    conversationId = conversationIdRaw;
  } else {
    return {
      ok: false,
      code: 'VALIDATION_ERROR',
      message: 'conversationId must be null or a string.',
    };
  }
  if (typeof o.clientMessageId !== 'string' || !isUuidV4(o.clientMessageId)) {
    return {
      ok: false,
      code: 'VALIDATION_ERROR',
      message: 'clientMessageId must be a UUID v4 string.',
    };
  }
  const clientMessageId = o.clientMessageId;
  if (typeof o.text !== 'string') {
    return {
      ok: false,
      code: 'VALIDATION_ERROR',
      message: 'text must be a string.',
      clientMessageId,
    };
  }
  const text = o.text;
  if (text.length > CHAT_MAX_TEXT_LENGTH) {
    return {
      ok: false,
      code: 'VALIDATION_ERROR',
      message: `text exceeds ${CHAT_MAX_TEXT_LENGTH} characters.`,
      clientMessageId,
    };
  }
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return {
      ok: false,
      code: 'VALIDATION_ERROR',
      message: 'text must not be empty or whitespace only.',
      clientMessageId,
    };
  }
  return {
    ok: true,
    payload: {
      conversationId,
      text: trimmed,
      clientMessageId,
    },
  };
}
