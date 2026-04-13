# Tutorial — exibir respostas do assistente em **stream** no Next.js (App Router)

Use este ficheiro como **contexto no Cursor** do projeto **frontend Next.js** (chat-app), em conjunto com `CHAT-APP-AUTH-INTEGRATION.md` para JWT e handshake do socket.

## O que mudou no backend (`chat-api`)

- O evento **`chat:chunk`** continua com o mesmo formato JSON, mas o campo **`chunk`** passou a ser um **delta real** do LLM (tamanho variável, muitas vezes sub-palavra), emitido **à medida que o modelo gera**.
- O cliente deve **concatenar** todos os `chunk` recebidos **em ordem** para a mesma combinação **`assistantMessageId` + `conversationId`**, até receber **`chat:complete`** para essa mensagem.
- Entre chunks pode haver **pausas** (ex.: enquanto o grafo executa ferramentas WMS/RAG). Isso é normal; não assumas intervalo constante entre eventos.
- Se o utilizador **desligar o socket** a meio, o servidor **pode não** enviar `chat:complete` para essa resposta.

### Formato dos eventos (servidor → cliente)

**`chat:chunk`**

```json
{
  "assistantMessageId": "uuid",
  "conversationId": "uuid",
  "chunk": "texto parcial",
  "sentAt": "2026-04-13T12:00:00.000Z"
}
```

**`chat:complete`**

```json
{
  "assistantMessageId": "uuid",
  "conversationId": "uuid",
  "sentAt": "2026-04-13T12:00:00.000Z"
}
```

**`chat:error`**, **`chat:session`**, **`chat:message_received`** — inalterados em relação à documentação existente; vê `CHAT-APP-AUTH-INTEGRATION.md` e comentários em `src/modules/chat/chat.gateway.ts` no repositório **chat-api**.

### Enviar mensagem (cliente → servidor)

Continua o evento **`chat:send`** com o payload validado pelo backend (inclui `clientMessageId`, `text`, `conversationId` ou `null` para nova conversa).

---

## Tipos TypeScript sugeridos (no Next.js)

```typescript
export type ChatChunkPayload = {
  assistantMessageId: string;
  conversationId: string;
  chunk: string;
  sentAt: string;
};

export type ChatCompletePayload = {
  assistantMessageId: string;
  conversationId: string;
  sentAt: string;
};

export type ChatMessageRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: ChatMessageRole;
  text: string;
  /** true enquanto ainda não chegou `chat:complete` para esta mensagem do assistente */
  isStreaming?: boolean;
};
```

---

## Modelo de estado na UI

1. Mantém uma lista de mensagens (`ChatMessage[]`).
2. Quando envias `chat:send`, adicionas a mensagem do **utilizador** e, opcionalmente, um placeholder do **assistente** com `text: ""`, `isStreaming: true`, e um `id` igual ao **`assistantMessageId` que o servidor vai usar** — **atenção:** o servidor gera o `assistantMessageId`; o cliente só o conhece **depois** do primeiro `chat:chunk` ou de outro evento que o inclua.
3. **Recomendado:** não cries o bubble do assistente até o **primeiro** `chat:chunk` (ou até `chat:message_received` se quiseres um skeleton). Assim associas o `assistantMessageId` do servidor ao item na lista.
4. Em cada `chat:chunk`:
   - encontra a mensagem com `id === assistantMessageId` (e opcionalmente confirma `conversationId`);
   - faz `text: prev.text + chunk`;
   - mantém `isStreaming: true`.
5. Em `chat:complete` para esse `assistantMessageId`: define `isStreaming: false`.

**Regra de ouro:** um único buffer de texto por `assistantMessageId` — append sequencial dos `chunk`.

---

## Exemplo com `socket.io-client` (componente cliente)

Coloca a lógica num componente com **`"use client"`**. O socket deve usar `auth: { token: accessToken }` como já descrito no guia de autenticação.

Funções puras úteis (podes colocar em `chat-stream-utils.ts`):

```typescript
import type { ChatChunkPayload, ChatMessage } from "./chat-types";

export const appendAssistantChunk = (
  prev: ChatMessage[],
  payload: ChatChunkPayload,
): ChatMessage[] => {
  const i = prev.findIndex((m) => m.id === payload.assistantMessageId);
  if (i === -1) {
    return [
      ...prev,
      {
        id: payload.assistantMessageId,
        role: "assistant" as const,
        text: payload.chunk,
        isStreaming: true,
      },
    ];
  }
  const copy = [...prev];
  const cur = copy[i];
  copy[i] = {
    ...cur,
    text: cur.text + payload.chunk,
    isStreaming: true,
  };
  return copy;
};

export const markAssistantComplete = (
  prev: ChatMessage[],
  assistantMessageId: string,
): ChatMessage[] =>
  prev.map((m) =>
    m.id === assistantMessageId ? { ...m, isStreaming: false } : m,
  );
```

Hook mínimo com **uma** instância de socket (`useRef`):

```typescript
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import type {
  ChatChunkPayload,
  ChatCompletePayload,
  ChatMessage,
} from "./chat-types";
import { appendAssistantChunk, markAssistantComplete } from "./chat-stream-utils";

type Params = { url: string; accessToken: string | null };

export const useChatSocket = ({ url, accessToken }: Params) => {
  const socketRef = useRef<Socket | null>(null);
  const conversationIdRef = useRef<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) {
      return undefined;
    }
    const socket = io(`${url}/chat`, {
      auth: { token: accessToken },
      transports: ["websocket"],
    });
    socketRef.current = socket;

    socket.on("chat:session", (body: { conversationId: string }) => {
      conversationIdRef.current = body.conversationId;
      setConversationId(body.conversationId);
    });

    socket.on("chat:chunk", (payload: ChatChunkPayload) => {
      setMessages((prev) => appendAssistantChunk(prev, payload));
    });

    socket.on("chat:complete", (payload: ChatCompletePayload) => {
      setMessages((prev) =>
        markAssistantComplete(prev, payload.assistantMessageId),
      );
    });

    socket.on("chat:error", (err: { code?: string; message?: string }) => {
      console.error("chat:error", err);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [url, accessToken]);

  const sendUserMessage = useCallback((text: string, clientMessageId: string) => {
    const socket = socketRef.current;
    if (!socket?.connected) {
      return;
    }
    setMessages((prev) => [
      ...prev,
      { id: clientMessageId, role: "user", text },
    ]);
    socket.emit("chat:send", {
      clientMessageId,
      text,
      conversationId: conversationIdRef.current,
    });
  }, []);

  return { messages, sendUserMessage, conversationId };
};
```

**Nota:** quando o `accessToken` for renovado, reconecta o socket (reexecutar o `useEffect` ao mudar o token) como no guia de autenticação.

---

## Boas práticas

- **Idempotência visual:** se receberes o mesmo `assistantMessageId` duas vezes no primeiro chunk, o `findIndex === -1` evita duplicar linhas; merges subsequentes só fazem append.
- **Indicador de “a pensar”:** entre `chat:send` e o primeiro `chat:chunk` pode passar tempo (tools). Mostra um estado de loading genérico, não um typewriter falso.
- **Markdown / formatação:** só interpreta Markdown (se quiseres) **depois** de `isStreaming === false`, para não re-renderizar o parser a cada delta.
- **Reconexão:** após refresh do token, reconecta o socket e, se necessário, reenvia o estado da conversa conforme a tua regra de produto (o backend atual não retoma streams a meio).

---

## Backend (`chat-api`) — LangChain: extrair texto dos deltas (`LlmAgentService`)

Ao fazer stream com LangChain.js, os eventos do modelo chegam como **`AIMessageChunk`**, mas na prática:

- **`AIMessageChunk` não é `instanceof AIMessage`**.
- **`message._getType()` devolve `"ai"`**, não `"AIMessageChunk"`.

Se o código do servidor fizer algo como:

- `message._getType() === "AIMessageChunk"` → **nunca é verdadeiro**;
- depois `message instanceof AIMessage` → **falso** para (quase) todos os chunks em stream;

então uma função estilo `messageBodyToText` pode devolver **sempre `""`** para os deltas. O socket continua a emitir a sequência de eventos, mas **`chat:chunk` vai com `chunk` vazio** (ou só em casos raros em que outro ramo trate a mensagem). O **`chat:complete`** pode chegar na mesma.

**Sintoma no frontend (Next.js):** o tutorial só cria ou atualiza a bolha do assistente em **`chat:chunk`** → ficas com loading / reticências e, no fim, **sem texto** (não confundir só com filtros de `conversationId` no cliente).

**Correção recomendada:** tratar qualquer mensagem com **`_getType() === "ai"`** (resposta final e chunks) e ler o `content` de forma unificada, por exemplo:

```typescript
private messageBodyToText(message: BaseMessage): string {
  if (message._getType() !== "ai") {
    return "";
  }
  const { content } = message as AIMessage;
  return this.messageContentBlocksToString(content);
}
```

(Adapta o nome do método auxiliar que junta blocos de conteúdo ao teu `LlmAgentService` / serviço equivalente.)

Depois de corrigir, faz **deploy ou restart** do `chat-api` e confirma no cliente ou nas DevTools (Socket.IO) que chegam **vários `chat:chunk` com texto** e que o conteúdo cresce até `chat:complete`.

---

## Prompt sugerido para colar no Cursor (projeto Next chat-app)

> O backend documentou streaming em `CHAT-APP-STREAMING-NEXT.md` do repositório chat-api. Adapta o chat do Next.js (App Router) para: (1) ouvir `chat:chunk` e concatenar texto por `assistantMessageId` até `chat:complete`; (2) mostrar estado de streaming (cursor ou skeleton) só enquanto `isStreaming`; (3) reutilizar uma única instância Socket.IO com JWT no `auth`, alinhado a `CHAT-APP-AUTH-INTEGRATION.md`. Não simules digitação artificial com delay se o backend já envia deltas reais — apenas concatena.

---

*Gerado para alinhar o frontend Next.js com streaming LLM real via Socket.IO no **chat-api**.*
