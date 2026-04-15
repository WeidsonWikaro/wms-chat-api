/**
 * Bridges an async producer (e.g. LangGraph stream) to an async iterator consumer
 * while keeping AsyncLocalStorage active for the whole producer run.
 */
export interface StreamChunkChannel {
  readonly push: (chunk: string) => void;
  readonly close: () => void;
  readonly fail: (err: unknown) => void;
  readonly chunks: AsyncGenerator<string, void, undefined>;
}

export interface CreateStreamChunkChannelOptions {
  /** Invoked before the consumer sees the error (e.g. abort LangGraph). */
  readonly onFail?: (err: unknown) => void;
}

export function createStreamChunkChannel(
  options?: CreateStreamChunkChannelOptions,
): StreamChunkChannel {
  const buffer: string[] = [];
  const waiters: Array<() => void> = [];
  let closed = false;
  let error: unknown | null = null;
  const notify = (): void => {
    const next = waiters.shift();
    if (next !== undefined) {
      next();
    }
  };
  async function* generator(): AsyncGenerator<string, void, undefined> {
    while (true) {
      while (buffer.length > 0) {
        yield buffer.shift()!;
      }
      if (closed) {
        if (error !== null) {
          throw error;
        }
        return;
      }
      await new Promise<void>((resolve) => {
        waiters.push(resolve);
      });
    }
  }
  return {
    push(chunk: string): void {
      if (closed) {
        return;
      }
      buffer.push(chunk);
      notify();
    },
    close(): void {
      if (closed) {
        return;
      }
      closed = true;
      notify();
    },
    fail(err: unknown): void {
      if (closed) {
        return;
      }
      options?.onFail?.(err);
      error = err;
      closed = true;
      notify();
    },
    chunks: generator(),
  };
}
