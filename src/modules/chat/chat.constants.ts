/**
 * Contract: `chat_protocol_version` — increment on breaking payload/event changes.
 * v1: inclui `chat:message_received` com `sentAt` do servidor para mensagens do utilizador.
 */
export const CHAT_PROTOCOL_VERSION = 1 as const;

/** Mensagem enviada automaticamente após conexão autenticada (`chat:session` → chunks → `chat:complete`). */
export const CHAT_WELCOME_MESSAGE =
  'Olá! Sou seu assistente. O que deseja?' as const;

export const CHAT_MAX_TEXT_LENGTH = 16_000;

/** Socket.IO engine path (default; keep in sync with client `path` option). */
export const SOCKET_IO_PATH = '/socket.io';
