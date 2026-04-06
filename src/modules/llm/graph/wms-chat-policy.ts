import {
  AIMessage,
  ToolMessage,
  type BaseMessage,
} from '@langchain/core/messages';
import type { WmsChatHaltReason } from './wms-chat-state.annotation';

export interface WmsChatPolicyLimits {
  readonly maxToolRounds: number;
  readonly maxSameToolStreak: number;
}

export interface AfterToolsPolicyDecision {
  /** Delta applied via reducer to `toolRoundCount` (always 1 after a tools node run). */
  readonly toolRoundCountDelta: number;
  readonly lastToolCallsSignature: string | null;
  readonly sameToolCallsStreak: number;
  readonly goto: 'agent' | 'forceEnd';
  readonly haltReason: WmsChatHaltReason | null;
}

/**
 * Stable JSON for tool call args (sorted object keys, deterministic arrays).
 */
export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  const pairs = keys.map(
    (key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`,
  );
  return `{${pairs.join(',')}}`;
}

/**
 * Signature of an AIMessage's tool_calls for repetition detection (order-normalized).
 */
export function toolCallsSignatureFromAi(message: AIMessage): string | null {
  const raw = message.tool_calls;
  if (!Array.isArray(raw) || raw.length === 0) {
    return null;
  }
  const sorted = [...raw].sort((a, b) =>
    String(a.name ?? '').localeCompare(String(b.name ?? '')),
  );
  const normalized = sorted.map((call) => ({
    name: call.name,
    args: call.args,
  }));
  return stableStringify(normalized);
}

/**
 * After ToolNode, messages end with ToolMessages. Walk back to the AIMessage that requested them.
 */
export function findLastAiMessageWithToolCalls(
  messages: BaseMessage[],
): AIMessage | null {
  let index = messages.length - 1;
  while (index >= 0 && ToolMessage.isInstance(messages[index])) {
    index -= 1;
  }
  if (index < 0) {
    return null;
  }
  const candidate = messages[index];
  if (!AIMessage.isInstance(candidate)) {
    return null;
  }
  if (!candidate.tool_calls?.length) {
    return null;
  }
  return candidate;
}

/**
 * Decide next step after tools executed: back to agent, or forced end (round limit / repeated tools).
 */
export function decideAfterToolsPolicy(
  messages: BaseMessage[],
  toolRoundCount: number,
  lastToolCallsSignature: string | null,
  sameToolCallsStreak: number,
  limits: WmsChatPolicyLimits,
): AfterToolsPolicyDecision {
  const newRoundTotal = toolRoundCount + 1;
  const ai = findLastAiMessageWithToolCalls(messages);
  const signature = ai ? toolCallsSignatureFromAi(ai) : null;
  const nextStreak =
    signature !== null &&
    lastToolCallsSignature !== null &&
    signature === lastToolCallsSignature
      ? sameToolCallsStreak + 1
      : signature !== null
        ? 1
        : 0;
  if (
    signature !== null &&
    nextStreak >= limits.maxSameToolStreak &&
    limits.maxSameToolStreak > 0
  ) {
    return {
      toolRoundCountDelta: 1,
      lastToolCallsSignature: signature,
      sameToolCallsStreak: nextStreak,
      goto: 'forceEnd',
      haltReason: 'repeated_tool_calls',
    };
  }
  if (newRoundTotal > limits.maxToolRounds && limits.maxToolRounds > 0) {
    return {
      toolRoundCountDelta: 1,
      lastToolCallsSignature: signature,
      sameToolCallsStreak: nextStreak,
      goto: 'forceEnd',
      haltReason: 'max_tool_rounds',
    };
  }
  return {
    toolRoundCountDelta: 1,
    lastToolCallsSignature: signature,
    sameToolCallsStreak: nextStreak,
    goto: 'agent',
    haltReason: null,
  };
}
