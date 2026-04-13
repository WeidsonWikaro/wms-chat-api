import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import type { BaseMessage } from '@langchain/core/messages';
import { AIMessage, SystemMessage } from '@langchain/core/messages';
import type { StructuredToolInterface } from '@langchain/core/tools';
import {
  Command,
  END,
  START,
  StateGraph,
  type LangGraphRunnableConfig,
} from '@langchain/langgraph';
import { ToolNode, toolsCondition } from '@langchain/langgraph/prebuilt';
import {
  WMS_CHAT_FORCE_END_MAX_TOOL_ROUNDS,
  WMS_CHAT_FORCE_END_REPEATED_TOOLS,
  WMS_CHAT_SYSTEM_PROMPT,
} from '../llm.constants';
import {
  decideAfterToolsPolicy,
  type WmsChatPolicyLimits,
} from './wms-chat-policy';
import { WmsChatStateAnnotation } from './wms-chat-state.annotation';

export interface BuildWmsChatGraphOptions {
  readonly limits: WmsChatPolicyLimits;
  /** Per ChatGoogleGenerativeAI.invoke (ms). Omit to disable. */
  readonly modelCallTimeoutMs?: number;
  /** Per ToolNode.invoke (ms). Omit to disable. */
  readonly toolNodeTimeoutMs?: number;
}

/**
 * WMS chat graph: `agent` ↔ `tools` → `policyAfterTools` (round / repeat limits) → `agent` | `forceEnd` → END.
 */
export function buildWmsChatGraph(
  model: ChatGoogleGenerativeAI,
  tools: StructuredToolInterface[],
  options: BuildWmsChatGraphOptions,
) {
  const { limits, modelCallTimeoutMs, toolNodeTimeoutMs } = options;
  const modelWithTools = model.bindTools(tools);
  const toolNode = new ToolNode(tools);

  const agent = async (
    state: typeof WmsChatStateAnnotation.State,
    config?: LangGraphRunnableConfig,
  ): Promise<{ messages: BaseMessage[] }> => {
    const callOptions: { signal?: AbortSignal; timeout?: number } = {};
    if (config?.signal !== undefined) {
      callOptions.signal = config.signal;
    }
    if (modelCallTimeoutMs !== undefined) {
      callOptions.timeout = modelCallTimeoutMs;
    }
    const response = await modelWithTools.invoke(
      [new SystemMessage(WMS_CHAT_SYSTEM_PROMPT), ...state.messages],
      Object.keys(callOptions).length > 0 ? callOptions : undefined,
    );
    return { messages: [response as BaseMessage] };
  };

  const runTools = async (
    state: typeof WmsChatStateAnnotation.State,
    config?: LangGraphRunnableConfig,
  ): Promise<{ messages: BaseMessage[] }> => {
    if (toolNodeTimeoutMs === undefined) {
      return toolNode.invoke(state, config) as Promise<{
        messages: BaseMessage[];
      }>;
    }
    return toolNode.invoke(state, {
      ...config,
      signal: config?.signal,
      timeout: toolNodeTimeoutMs,
    }) as Promise<{ messages: BaseMessage[] }>;
  };

  const policyAfterTools = (
    state: typeof WmsChatStateAnnotation.State,
  ): Command => {
    const decision = decideAfterToolsPolicy(
      state.messages,
      state.toolRoundCount,
      state.lastToolCallsSignature,
      state.sameToolCallsStreak,
      limits,
    );
    return new Command({
      update: {
        toolRoundCount: decision.toolRoundCountDelta,
        lastToolCallsSignature: decision.lastToolCallsSignature,
        sameToolCallsStreak: decision.sameToolCallsStreak,
        haltReason: decision.goto === 'forceEnd' ? decision.haltReason : null,
      },
      goto: decision.goto,
    });
  };

  const forceEnd = async (
    state: typeof WmsChatStateAnnotation.State,
  ): Promise<{
    messages: BaseMessage[];
    haltReason: null;
  }> => {
    const reason = state.haltReason;
    const content =
      reason === 'repeated_tool_calls'
        ? WMS_CHAT_FORCE_END_REPEATED_TOOLS
        : WMS_CHAT_FORCE_END_MAX_TOOL_ROUNDS;
    return {
      messages: [new AIMessage({ content })],
      haltReason: null,
    };
  };

  return new StateGraph(WmsChatStateAnnotation)
    .addNode('agent', agent, { ends: ['tools', END] })
    .addNode('tools', runTools, { ends: ['policyAfterTools'] })
    .addNode('policyAfterTools', policyAfterTools, {
      ends: ['agent', 'forceEnd'],
    })
    .addNode('forceEnd', forceEnd, { ends: [END] })
    .addEdge(START, 'agent')
    .addConditionalEdges('agent', toolsCondition, ['tools', END])
    .addEdge('tools', 'policyAfterTools')
    .addEdge('forceEnd', END)
    .compile();
}
