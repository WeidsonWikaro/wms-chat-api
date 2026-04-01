import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import type { BaseMessage } from '@langchain/core/messages';
import { SystemMessage } from '@langchain/core/messages';
import type { StructuredToolInterface } from '@langchain/core/tools';
import {
  END,
  MessagesAnnotation,
  START,
  StateGraph,
} from '@langchain/langgraph';
import { ToolNode, toolsCondition } from '@langchain/langgraph/prebuilt';
import { WMS_CHAT_SYSTEM_PROMPT } from '../llm.constants';

/**
 * WMS chat graph: `agent` (Gemini + tools) ↔ `tools` (executa tools, ex. produto).
 */
export function buildWmsChatGraph(
  model: ChatGoogleGenerativeAI,
  tools: StructuredToolInterface[],
) {
  const modelWithTools = model.bindTools(tools);
  const toolNode = new ToolNode(tools);

  const agent = async (
    state: typeof MessagesAnnotation.State,
  ): Promise<{ messages: BaseMessage[] }> => {
    const response = await modelWithTools.invoke([
      new SystemMessage(WMS_CHAT_SYSTEM_PROMPT),
      ...state.messages,
    ]);
    return { messages: [response as BaseMessage] };
  };

  return new StateGraph(MessagesAnnotation)
    .addNode('agent', agent)
    .addNode('tools', toolNode)
    .addEdge(START, 'agent')
    .addConditionalEdges('agent', toolsCondition, ['tools', END])
    .addEdge('tools', 'agent')
    .compile();
}
