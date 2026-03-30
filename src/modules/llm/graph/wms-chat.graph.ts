import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import type { BaseMessage } from '@langchain/core/messages';
import { SystemMessage } from '@langchain/core/messages';
import { END, MessagesAnnotation, START, StateGraph } from '@langchain/langgraph';
import { WMS_CHAT_SYSTEM_PROMPT } from '../llm.constants';

/**
 * Minimal WMS chat graph: single `agent` node calling Gemini via LangChain.
 * Extend with branches, tools, or checkpoints as the product grows.
 */
export function buildWmsChatGraph(model: ChatGoogleGenerativeAI) {
  const agent = async (
    state: typeof MessagesAnnotation.State,
  ): Promise<{ messages: BaseMessage[] }> => {
    const response = await model.invoke([
      new SystemMessage(WMS_CHAT_SYSTEM_PROMPT),
      ...state.messages,
    ]);
    return { messages: [response as BaseMessage] };
  };
  return new StateGraph(MessagesAnnotation)
    .addNode('agent', agent)
    .addEdge(START, 'agent')
    .addEdge('agent', END)
    .compile();
}
