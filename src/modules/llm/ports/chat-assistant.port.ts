import type { ChatUserTurnContext } from '../interfaces/chat-user-turn-context.interface';

/**
 * Abstraction between the Chat module (Socket.IO) and the LLM stack (LangChain / LangGraph).
 * Chat depends on this port, not on concrete LangChain services.
 */
export interface ChatAssistantPort {
  /**
   * Produces the assistant reply text for one user message.
   */
  generateReply(context: ChatUserTurnContext): Promise<string>;
}

/** Injection token for {@link ChatAssistantPort}. */
export const CHAT_ASSISTANT = Symbol('CHAT_ASSISTANT');
