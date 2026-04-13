import type { ChatUserTurnContext } from '../interfaces/chat-user-turn-context.interface';

/**
 * Options for {@link ChatAssistantPort.streamReply}.
 * Pass `signal` to abort when the client disconnects; the implementation always enforces turn timeout.
 */
export interface StreamReplyOptions {
  readonly signal?: AbortSignal;
}

/**
 * Abstraction between the Chat module (Socket.IO) and the LLM stack (LangChain / LangGraph).
 * Chat depends on this port, not on concrete LangChain services.
 */
export interface ChatAssistantPort {
  /**
   * Produces the assistant reply text for one user message.
   * Implemented by consuming {@link streamReply} (full string after stream ends).
   */
  generateReply(context: ChatUserTurnContext): Promise<string>;

  /**
   * Streams assistant text deltas for one user message (LLM token / chunk granularity).
   * Stops when the graph run completes, the turn times out, or `options.signal` aborts.
   */
  streamReply(
    context: ChatUserTurnContext,
    options?: StreamReplyOptions,
  ): AsyncIterable<string>;
}

/** Injection token for {@link ChatAssistantPort}. */
export const CHAT_ASSISTANT = Symbol('CHAT_ASSISTANT');
