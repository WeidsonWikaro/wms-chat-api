import { AsyncLocalStorage } from 'node:async_hooks';
import type { ChatApprovalSignal } from './interfaces/chat-approval-signal.type';

/**
 * Per-request context for chat tools (same Nest instance, concurrent sockets).
 */
export interface ChatToolRuntimeContext {
  readonly userId: string;
  readonly conversationId: string;
  readonly approvalSignal: ChatApprovalSignal;
  readonly clientMessageId: string;
}

export const chatToolRuntimeStorage =
  new AsyncLocalStorage<ChatToolRuntimeContext>();

export function getChatToolRuntimeContext():
  | ChatToolRuntimeContext
  | undefined {
  return chatToolRuntimeStorage.getStore();
}
