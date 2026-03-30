import type { ChatSendParseSuccess } from '../../chat/chat-validation';

/**
 * One validated user turn from the chat socket, plus server-side context for the LLM layer.
 */
export interface ChatUserTurnContext {
  readonly userId: string;
  /** Active conversation id after ChatService resolved or created the session. */
  readonly activeConversationId: string;
  /** Full successful parse from `parseChatSendPayload` (includes `text`, `clientMessageId`, `conversationId`). */
  readonly parsed: ChatSendParseSuccess;
}
