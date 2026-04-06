import { AIMessage, HumanMessage, ToolMessage } from '@langchain/core/messages';
import {
  decideAfterToolsPolicy,
  findLastAiMessageWithToolCalls,
  stableStringify,
  toolCallsSignatureFromAi,
} from './wms-chat-policy';

describe('stableStringify', () => {
  it('orders object keys deterministically', () => {
    expect(stableStringify({ b: 1, a: 2 })).toBe(stableStringify({ a: 2, b: 1 }));
  });
});

describe('toolCallsSignatureFromAi', () => {
  it('normalizes tool call order by name', () => {
    const msg = new AIMessage({
      content: '',
      tool_calls: [
        { name: 'b', args: { x: 1 }, id: '1', type: 'tool_call' },
        { name: 'a', args: { y: 2 }, id: '2', type: 'tool_call' },
      ],
    });
    const msg2 = new AIMessage({
      content: '',
      tool_calls: [
        { name: 'a', args: { y: 2 }, id: '2', type: 'tool_call' },
        { name: 'b', args: { x: 1 }, id: '1', type: 'tool_call' },
      ],
    });
    expect(toolCallsSignatureFromAi(msg)).toBe(toolCallsSignatureFromAi(msg2));
  });
});

describe('findLastAiMessageWithToolCalls', () => {
  it('finds AI message before trailing tool messages', () => {
    const ai = new AIMessage({
      content: '',
      tool_calls: [
        { name: 'get_x', args: { id: 'u' }, id: 'c1', type: 'tool_call' },
      ],
    });
    const tool = new ToolMessage({ content: '{}', tool_call_id: 'c1' });
    const found = findLastAiMessageWithToolCalls([
      new HumanMessage('hi'),
      ai,
      tool,
    ]);
    expect(found).toBe(ai);
  });
});

describe('decideAfterToolsPolicy', () => {
  const limits = { maxToolRounds: 8, maxSameToolStreak: 2 };

  it('routes to agent on first tool round', () => {
    const ai = new AIMessage({
      content: '',
      tool_calls: [
        { name: 't', args: { a: 1 }, id: '1', type: 'tool_call' },
      ],
    });
    const tool = new ToolMessage({ content: '{}', tool_call_id: '1' });
    const d = decideAfterToolsPolicy(
      [new HumanMessage('q'), ai, tool],
      0,
      null,
      0,
      limits,
    );
    expect(d.goto).toBe('agent');
    expect(d.toolRoundCountDelta).toBe(1);
    expect(d.haltReason).toBeNull();
  });

  it('forceEnd when same tool signature repeats (streak >= max)', () => {
    const sigAi = new AIMessage({
      content: '',
      tool_calls: [
        { name: 't', args: { id: 'same' }, id: '1', type: 'tool_call' },
      ],
    });
    const tool = new ToolMessage({ content: '{}', tool_call_id: '1' });
    const messages = [new HumanMessage('q'), sigAi, tool];
    const prevSig = toolCallsSignatureFromAi(sigAi);
    const d = decideAfterToolsPolicy(messages, 3, prevSig, 1, limits);
    expect(d.goto).toBe('forceEnd');
    expect(d.haltReason).toBe('repeated_tool_calls');
  });

  it('forceEnd when tool rounds exceed max', () => {
    const ai = new AIMessage({
      content: '',
      tool_calls: [
        { name: 't', args: { a: 2 }, id: '1', type: 'tool_call' },
      ],
    });
    const tool = new ToolMessage({ content: '{}', tool_call_id: '1' });
    const d = decideAfterToolsPolicy(
      [new HumanMessage('q'), ai, tool],
      8,
      null,
      0,
      limits,
    );
    expect(d.goto).toBe('forceEnd');
    expect(d.haltReason).toBe('max_tool_rounds');
  });
});
