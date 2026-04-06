import type { BaseMessage } from '@langchain/core/messages';
import { Annotation, messagesStateReducer } from '@langchain/langgraph';

/**
 * Set when routing to {@link forceEnd}: which user-facing message to emit.
 */
export type WmsChatHaltReason = 'max_tool_rounds' | 'repeated_tool_calls';

/**
 * LangGraph state: chat messages plus policy counters (tool rounds, repeated tool signatures).
 */
export const WmsChatStateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),
  toolRoundCount: Annotation<number>({
    reducer: (left, right) => left + right,
    default: () => 0,
  }),
  lastToolCallsSignature: Annotation<string | null>({
    reducer: (_previous, next) => next,
    default: () => null,
  }),
  sameToolCallsStreak: Annotation<number>({
    reducer: (_previous, next) => next,
    default: () => 0,
  }),
  haltReason: Annotation<WmsChatHaltReason | null>({
    reducer: (_previous, next) => next,
    default: () => null,
  }),
});
