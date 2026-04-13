import type { Socket } from 'socket.io';
import { ChatService } from './chat.service';
import type { ChatAssistantPort } from '../llm/ports/chat-assistant.port';
import type { ChatSendParseSuccess } from './chat-validation';

function createAssistantMock(chunks: string[]): ChatAssistantPort {
  const slice = [...chunks];
  return {
    generateReply: jest.fn(() => Promise.resolve(slice.join(''))),
    streamReply(): AsyncIterable<string> {
      let index = 0;
      return {
        [Symbol.asyncIterator](): AsyncIterator<string> {
          return {
            next(): Promise<IteratorResult<string, void>> {
              if (index >= slice.length) {
                return Promise.resolve({ value: undefined, done: true });
              }
              const value = slice[index];
              index += 1;
              return Promise.resolve({ value, done: false });
            },
          };
        },
      };
    },
  };
}

describe('ChatService', () => {
  describe('streamAssistantReply (LLM stream)', () => {
    it('emits chat:chunk in order then chat:complete', async () => {
      const assistant = createAssistantMock(['Hel', 'lo']);
      const service = new ChatService(assistant);
      const emitMock = jest.fn();
      const client = {
        emit: emitMock,
        connected: true,
        once: jest.fn(),
        removeListener: jest.fn(),
      } as unknown as Socket;
      const parsed: ChatSendParseSuccess = {
        payload: {
          conversationId: 'conv-1',
          text: 'hi',
          clientMessageId: 'c1',
        },
      };
      const streamReply = (
        service as unknown as {
          streamAssistantReply: typeof ChatService.prototype.streamAssistantReply;
        }
      ).streamAssistantReply.bind(service);
      await streamReply(client, {
        userId: 'u1',
        activeConversationId: 'conv-1',
        parsed,
        assistantMessageId: 'a1',
        clientMessageId: 'c1',
      });
      const calls = emitMock.mock.calls as Array<
        [string, { chunk?: string; assistantMessageId?: string }]
      >;
      const chunkCalls = calls.filter((c) => c[0] === 'chat:chunk');
      expect(chunkCalls).toHaveLength(2);
      expect(chunkCalls[0][1].chunk).toBe('Hel');
      expect(chunkCalls[1][1].chunk).toBe('lo');
      const completeCalls = calls.filter((c) => c[0] === 'chat:complete');
      expect(completeCalls).toHaveLength(1);
    });

    it('does not emit chat:complete when socket disconnected', async () => {
      const assistant = createAssistantMock(['a', 'b']);
      const service = new ChatService(assistant);
      const emitMock = jest.fn();
      const client = {
        emit: emitMock,
        connected: false,
        once: jest.fn(),
        removeListener: jest.fn(),
      } as unknown as Socket;
      const parsed: ChatSendParseSuccess = {
        payload: {
          conversationId: 'conv-1',
          text: 'hi',
          clientMessageId: 'c1',
        },
      };
      const streamReply = (
        service as unknown as {
          streamAssistantReply: typeof ChatService.prototype.streamAssistantReply;
        }
      ).streamAssistantReply.bind(service);
      await streamReply(client, {
        userId: 'u1',
        activeConversationId: 'conv-1',
        parsed,
        assistantMessageId: 'a1',
        clientMessageId: 'c1',
      });
      const calls = emitMock.mock.calls as Array<[string, unknown]>;
      expect(calls.some((c) => c[0] === 'chat:complete')).toBe(false);
    });
  });
});
