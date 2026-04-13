# Estrutura do módulo LLM (`src/modules/llm`)

Este documento descreve **o que cada pasta e arquivo faz** e **por que** a estrutura foi organizada assim. O objetivo é manter o **chat (Socket.IO)** desacoplado do **motor de IA (LangChain, LangGraph, Gemini)**.

---

## 1. Ideia central em três camadas

O módulo LLM separa três preocupações:

| Camada | O quê | Por quê |
|--------|--------|--------|
| **Contrato com o resto do Nest** | Quem pode chamar o LLM e com quais dados | Outros módulos não dependem de classes concretas do LangChain |
| **Orquestração de IA** | Grafo LangGraph + chamada ao modelo | Fluxo explícito, pronto para crescer (tools, ramos, checkpoints) |
| **Configuração e texto fixo** | Modelo default, system prompt, variáveis de ambiente | Evita “magic strings” e concentra decisões de produto |

Assim, o **Chat** não importa `ChatGoogleGenerativeAI` nem `StateGraph`: só a **porta** `ChatAssistantPort`.

---

## 2. Mapa de pastas (conceito)

| Pasta | Papel |
|--------|--------|
| **`ports/`** | Contratos que o domínio LLM **expõe para fora** (inversão de dependência) |
| **`interfaces/`** | Tipos de **entrada** do domínio LLM (contexto de um turno; não são DTOs HTTP) |
| **`graph/`** | Definição do **LangGraph** (fluxo entre nós), sem regras específicas do Nest |
| **`services/`** | **Providers** Nest que ligam `ConfigService`, LangChain e o grafo compilado |

---

## 3. Arquivo a arquivo

### `llm.module.ts`

- **O quê:** Módulo Nest do domínio LLM: registra providers e exporta o que outros módulos precisam (`LlmAgentService` + token de injeção `CHAT_ASSISTANT`).
- **Por quê:** Padrão NestJS — um módulo por domínio. Declara `imports: [ConfigModule]` para ler `GOOGLE_API_KEY`, `LLM_GOOGLE_MODEL`, etc.
- **Detalhe:** Uso de `useExisting: LlmAgentService` no token `CHAT_ASSISTANT` garante **uma única instância** do serviço quando alguém injeta a interface pelo token.

---

### `ports/chat-assistant.port.ts`

- **O quê:** Define a interface **`ChatAssistantPort`** (método `generateReply`) e o símbolo **`CHAT_ASSISTANT`** usado na injeção de dependência.
- **Por quê:** *Dependency inversion* — o `ChatService` depende de **abstração**, não de `LlmAgentService`. Facilita testes (mock), troca de implementação ou encadeamento futuro (fila, outro provedor) sem espalhar detalhes do LangChain pelo módulo de chat.

---

### `interfaces/chat-user-turn-context.interface.ts`

- **O quê:** Tipo **`ChatUserTurnContext`**: `userId`, `activeConversationId` e **`parsed`** com o resultado **bem-sucedido** do `parseChatSendPayload` (`ChatSendParseSuccess`).
- **Por quê:** O agente recebe o **parse completo** (`ok: true`), não só o texto. Isso permite usar depois `clientMessageId`, `conversationId` do payload em tools, RAG, logs ou LangSmith sem mudar a assinatura pública do porto.

---

### `llm.constants.ts`

- **O quê:** Constantes como **`DEFAULT_LLM_GOOGLE_MODEL`** e **`WMS_CHAT_SYSTEM_PROMPT`**.
- **Por quê:** Um lugar só para defaults e para o prompt de sistema; facilita revisão, versionamento e evita strings duplicadas no grafo ou no serviço.

---

### `graph/wms-chat.graph.ts`

- **O quê:** Monta o **LangGraph** (`StateGraph` com `MessagesAnnotation`): nó **`agent`** que invoca o modelo com **SystemMessage + mensagens do estado**.
- **Por quê:** O fluxo de “agente” fica **explícito** e isolado. Hoje é um grafo mínimo (um nó); amanhã você adiciona nós (classificar intenção, tools, confirmação humana) sem misturar isso com WebSocket ou JWT.

---

### `services/llm-agent.service.ts`

- **O quê:** Implementação Nest da porta: no **`onModuleInit`** instancia **`ChatGoogleGenerativeAI`**, compila o grafo; **`streamReply`** corre o grafo com **`streamMode: "messages"`** e produz **deltas de texto** do nó `agent` (e mensagens finais do `forceEnd`); **`generateReply`** consome esse stream e devolve o texto completo.
- **Por quê:** Lifecycle do Nest (`OnModuleInit`) e **`ConfigService`** ficam aqui; o ficheiro do grafo permanece **quase puro** (só definição). Tratamento de conteúdo da resposta (`AIMessage` com `content` string ou multimodal) também fica centralizado no serviço.

---

## 4. Como o Chat usa isto (fluxo mental)

```text
Socket `chat:send` → parse OK → ChatService emite `chat:message_received`
        → ChatAssistantPort.generateReply(ChatUserTurnContext)
        → LlmAgentService (LangGraph + Gemini)
        → texto → ChatService fatia em `chat:chunk` + `chat:complete`
```

- **Transporte** (eventos, IDs de mensagem, conversação): **módulo Chat**.
- **Texto da resposta**: **módulo LLM** devolve apenas `string`; quem formata o protocolo de streaming é o Chat.

---

## 5. Benefícios práticos desta estrutura

1. **Testes:** mock de `ChatAssistantPort` sem subir Gemini.
2. **Evolução:** novos nós no `graph/` sem tocar no gateway.
3. **Clareza:** quem abre o repositório vê onde está o **contrato**, onde está o **grafo** e onde está o **“fio” Nest**.

---

## 6. Variáveis de ambiente relevantes

| Variável | Papel |
|----------|--------|
| `GOOGLE_API_KEY` | Chave da API Gemini (obrigatória para o serviço atual) |
| `LLM_GOOGLE_MODEL` | Opcional; se vazio, usa o default em `llm.constants.ts` |
| `LANGCHAIN_*` | Opcional — LangSmith / tracing (ver `.env.example`) |

---

*Documento alinhado à estrutura atual do repositório; ajuste este ficheiro se renomear ficheiros ou extrair novos nós no grafo.*
