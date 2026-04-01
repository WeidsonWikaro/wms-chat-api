# Fluxo do agente LLM (WMS) — chamada, grafo e conceitos

Documento em **português do Brasil**: fluxo em cascata do chat até o Gemini, fluxograma do `StateGraph`, e referência rápida dos métodos do LangGraph usados no projeto.

---

## 1. Fluxo de chamada do agente e sua execução/definição (modelo cascata)

Texto em **cascata** (indentação = subnível). Ordem de leitura: de cima para baixo, da esquerda para a direita em cada nível.

```text
chat.service.ts
    Após sucesso do recebimento da mensagem do Socket.IO (validação, sessão, etc.)
    Emite chat:message_received para o cliente
    Executa generateReply passando dados completos da mensagem (ChatUserTurnContext, incluindo parsed ok)

llm-agent.service.ts

    FASE DE PREPARAÇÃO DO SERVICE (onModuleInit) — corre uma vez no arranque da app
        Pega GOOGLE_API_KEY das configs do projeto (ConfigService) e valida
        Define o nome do modelo de IA (modelName): LLM_GOOGLE_MODEL ou default em llm.constants.ts
        Cria o modelo de IA (this.model) — ChatGoogleGenerativeAI (Gemini via LangChain)
        Monta as tools que o modelo pode pedir: createProductTools(this.productsService)

        createProductTools (função que monta ferramentas para o LangChain)

            Tool 1 — get_product_by_id
                Recebe id (string)
                Se não for UUID v4 válido → devolve JSON com aviso (INVALID_ID)
                Se for válido → chama productsService.findOne(trimmed)
                Se achar o produto → devolve JSON contendo product
                Se não achar → devolve JSON contendo NOT_FOUND (NotFoundException tratada)

            Tool 2 — get_product_by_barcode
                Recebe barcode (string)
                Se vazio após trim → JSON de erro
                Chama productsService.findByBarcode(trimmed)
                Se achar → JSON com product; se não → NOT_FOUND

        Monta o grafo passando o modelo e as tools: buildWmsChatGraph(this.model, productTools)

        buildWmsChatGraph (monta um fluxograma/grafo com a lógica do assistente)

            Monta modelWithTools = model.bindTools(tools) — modelo com tools ligadas ao Gemini

            Monta toolNode = new ToolNode(tools) — nó pronto: olha o último pedido do assistente;
                se ele pediu ferramentas (tool calls), executa-as e acrescenta as respostas ao estado
                (lista de mensagens — ver MessagesAnnotation)

            Monta a função do nó agent (o nó agent que chama o Gemini com as ferramentas)
                Recebe estado atual (state, sobretudo state.messages)
                Monta uma lista para o modelo:
                    SystemMessage(WMS_CHAT_SYSTEM_PROMPT) — informa ao agente quem ele é, regras WMS, quando usar as ferramentas
                    ...state.messages — todas as mensagens do estado, incluindo resultados das ferramentas (ToolMessage) após voltas
                Chama modelWithTools.invoke([...]) — invoca o Gemini com essa lista
                Aguarda response — pode ser texto (resposta final) ou pedido de ferramenta (tool calls na AIMessage)

            Monta o grafo: return new StateGraph(MessagesAnnotation).(...).compile()
                Estado principal: lista de mensagens (MessagesAnnotation)

                Contém o nó 'agent' — executa o Gemini (função agent acima)

                Contém o nó 'tools' — executa as ferramentas pedidas (ToolNode)

                Contém addEdge(START, 'agent') — indica que começa sempre no agent (primeiro passo: o modelo “pensa”)

                Contém addConditionalEdges('agent', toolsCondition, ['tools', END]) — depois do agente,
                    toolsCondition olha a última mensagem: se tiver tool_calls → vai para tools;
                    se não → termina o grafo (END)

                Contém addEdge('tools', 'agent') — depois de executar tools, volta ao agent para o modelo
                    ler o resultado e responder em texto ou pedir mais tools

                Contém compile() — fecha o grafo para poder usar invoke / stream

    FASE DE EXECUÇÃO (generateReply) — corre a cada mensagem do chat
        Pega o texto da mensagem: context.parsed.payload.text
        Invoca o grafo: this.graph.invoke({ messages: [new HumanMessage(text)] }, { recursionLimit: 12 })
            HumanMessage = a “pergunta” que entra no grafo
            recursionLimit: 12 = limite de voltas entre agent e tools (evita loop infinito)
        Pega a última mensagem do resultado do grafo (last)
        Se for AIMessage → resposta final do assistente; messageContentToString → string única;
            devolve ao chat para fatiar e mandar no socket (chat:chunk / chat:complete)
        Se não for AIMessage → plano B: converte o que der e regista aviso no log
```

---

## 2. Fluxograma em texto do grafo (`wms-chat.graph.ts`)

### Código que cria o grafo (trecho final de `buildWmsChatGraph`)

Isto encadeia nós, arestas e `compile()` — corresponde ao fluxograma ASCII logo abaixo.

```typescript
  return new StateGraph(MessagesAnnotation)
    .addNode('agent', agent)
    .addNode('tools', toolNode)
    .addEdge(START, 'agent')
    .addConditionalEdges('agent', toolsCondition, ['tools', END])
    .addEdge('tools', 'agent')
    .compile();
```

Fonte: `src/modules/llm/graph/wms-chat.graph.ts` (linhas 34–40).

---

### Fluxograma equivalente (ASCII)

Somente **ASCII** (sem Mermaid). Lê de cima para baixo; `┌`/`└` marcam ramos.

```text
                    ┌─────────────────────────────────────┐
                    │              START                  │
                    └──────────────────┬──────────────────┘
                                       │
                                       ▼
                    ┌─────────────────────────────────────┐
                    │  Nó: agent                          │
                    │  Gemini + system + state.messages   │
                    └──────────────────┬──────────────────┘
                                       │
                         ┌─────────────┴─────────────┐
                         │   toolsCondition          │
                         │   última AIMessage tem    │
                         │   tool_calls?             │
                         └─────────────┬─────────────┘
                    ┌──────────────────┼──────────────────┐
                    │ SIM              │              NÃO │
                    ▼                  │                  ▼
     ┌──────────────────────┐        │     ┌──────────────────────┐
     │  Nó: tools           │        │     │  END                 │
     │  ToolNode executa    │        │     │  Fim do grafo        │
     │  as tools pedidas    │        │     │  (resposta final     │
     └──────────┬───────────┘        │     │   já em texto)       │
                │                     │     └──────────────────────┘
                │                     │
                └─────────────────────┘
                          │
                          │  (volta para o agent ler ToolMessage
                          │   e gerar nova AIMessage)
                          ▼
                    ┌─────────────────────────────────────┐
                    │  Nó: agent  (de novo)               │
                    └──────────────────┬──────────────────┘
                                       │
                         (repete até não haver tool_calls → END,
                          ou até recursionLimit no invoke)
```

**Linha única (resumo):**

`START → agent → (tool_calls?) → sim → tools → agent → … | não → END`

---

## 3. Quem “indica” ao agente que deve usar a tool de produto?

Não existe no backend um `if` do tipo “se a mensagem falar de produto → chama tool”. Quem **decide** se pede uma ferramenta (e qual) é o **modelo** (Gemini), com base no que segue.

### O que entra na decisão

1. **`bindTools(tools)`** — Expõe ao modelo o **menu** das ferramentas: nome, **descrição** de cada uma e **schema** dos argumentos (`id`, `barcode`…). Isto **não** força a execução; só diz **o que existe** e **como** deve ser invocado.

2. **Descrições em `create-product-tools.ts`** — Textos como “Busca um produto pelo id (UUID v4)…” / “…pelo código de barras…” orientam o modelo **semanticamente**: em que situação cada tool faz sentido.

3. **`WMS_CHAT_SYSTEM_PROMPT`** (`llm.constants.ts`) — Regras gerais: assistente WMS, português, **usar só as tools** para dados de produto por **UUID** ou **código de barras**, não inventar dados, pedir id/barcode se o utilizador só disser o nome, etc.

4. **Mensagem do utilizador** — O modelo junta system + histórico no estado + texto atual e **infere** se deve responder só em texto ou emitir **tool calls** (nome da tool + argumentos).

### Resumo

| Peça | Papel |
|------|--------|
| `bindTools` + metadados das tools | Lista **quais** ferramentas existem e **com que parâmetros**. |
| Descrições das tools | Sugerem **quando** usar cada uma. |
| Prompt de sistema | Alinha **regras de negócio** (WMS, id/barcode, não inventar). |
| Mensagem do utilizador | Dispara a **decisão** do modelo (incluindo “quero dados deste código”). |

O **`toolsCondition`** e o nó **`tools`** só entram **depois**: executam o que o modelo **já pediu** na `AIMessage` (tool calls).

**Nota:** Se o modelo não chamar a tool quando devia, o ajuste costuma ser **reforçar** o system prompt e as descrições das tools (e, se necessário, exemplos no prompt). Só em fluxos muito rígidos faria sentido um **roteamento em código** (classificador) em paralelo ao modelo.

---

## 4. Conceitos: nó, aresta e aresta condicional

### Nó (`node`)

Um **nó** é um **passo** do fluxo — uma “caixinha” com um **trabalho** bem definido.

No grafo deste projeto existem dois nós nomeados:

| Nó | Função |
|----|--------|
| **`agent`** | Corre a lógica que chama o **Gemini** com system prompt + mensagens do estado (e tools ligadas via `bindTools`). |
| **`tools`** | Corre o **`ToolNode`**, que **executa** as ferramentas pedidas pelo modelo (ex.: produto por id/barcode) e atualiza o estado. |

**Analogia:** num fluxograma em papel, cada retângulo com uma ação (“validar”, “consultar base”, “responder”) é um **nó**.

---

### Aresta (`edge`)

Uma **aresta** (*edge*) é uma **ligação fixa** entre dois pontos: **depois de A, vai sempre para B**.

| Exemplo no código | Significado |
|-------------------|-------------|
| `addEdge(START, 'agent')` | O grafo **começa** e entra **sempre** primeiro no nó **`agent`**. |
| `addEdge('tools', 'agent')` | Depois do nó **`tools`**, o fluxo vai **sempre** de volta ao **`agent`** (o modelo lê o resultado das tools). |

**Analogia:** uma **seta fixa** — não depende de condição.

**Notação:** `addEdge(origem, destino)` — **origem** → **destino** (não significa “início e fim da aplicação inteira”, exceto quando `START` ou `END` aparecem explicitamente).

---

### Aresta condicional (`conditional edge`)

Uma **aresta condicional** é uma **bifurcação**: depois do nó X, o **próximo** passo **depende de uma regra**.

| Exemplo no código | Significado |
|-------------------|-------------|
| `addConditionalEdges('agent', toolsCondition, ['tools', END])` | Sai do nó **`agent`**. A função **`toolsCondition`** olha o estado (tipicamente a **última mensagem**). Se houver **tool calls** na última `AIMessage` → próximo nó é **`tools`**. Caso contrário → **`END`** (termina o grafo). |

**Analogia:** um **losango** no fluxograma (sim/não) — o caminho **não** é sempre o mesmo.

**Sobre `toolsCondition`:** é uma função **pronta** do `@langchain/langgraph/prebuilt` para esse padrão agente + tools. Podes usar **outras** funções no 2º argumento de `addConditionalEdges`, desde que devolvam o nome do próximo nó (ou `END`) de acordo com o teu `pathMap`.

---

## 5. Métodos do builder do `StateGraph` (referência rápida)

| Método | Argumentos (ideia) | O que faz |
|--------|---------------------|-----------|
| **`addNode(nome, ação)`** | **nome**: string do nó. **ação**: função ou runnable executado quando o fluxo entra nesse nó. | Regista um passo no grafo. |
| **`addEdge(origem, destino)`** | **origem**: nó de saída ou `START`. **destino**: nó de entrada ou `END`. | Ligação **sempre** igual: origem → destino. |
| **`addConditionalEdges(origem, condição, mapaDestinos)`** | **origem**: nó após o qual se decide. **condição**: função (ex. `toolsCondition`) que devolve para onde ir. **mapaDestinos**: lista/objeto que associa esse retorno aos nós possíveis (ex. `['tools', END]`). | **Bifurcação** conforme regra. |
| **`addSequence(...)`** | Vários nós em sequência. | Adiciona nós e liga **em cadeia** (útil para pipelines lineares). |
| **`compile(opções?)`** | Opcional: `checkpointer`, `interruptBefore` / `interruptAfter`, `name`, etc. | **Compila** o grafo num objeto com **`invoke`**, **`stream`**, etc. |

Métodos **antigos** (substituídos por `addEdge`): `setEntryPoint` / `setFinishPoint` — preferir `addEdge(START, …)` e `addEdge(…, END)`.

---

## 6. Funções prontas para `addConditionalEdges` (prebuilt)

No **`@langchain/langgraph/prebuilt`**, o helper mais usado para o padrão **modelo + ToolNode** é:

| Função | Papel |
|--------|--------|
| **`toolsCondition`** | Devolve `"tools"` se a última mensagem tiver **tool calls**; senão devolve **`END`**. |

Para outras regras (intenção, flags no estado, etc.), costuma-se escrever uma **função própria** `(state) => 'nomeDoNo' | END`.

---

## 7. Ficheiros principais envolvidos

| Ficheiro | Papel |
|----------|--------|
| `src/modules/chat/chat.service.ts` | Valida mensagem, chama `generateReply`, emite chunks no socket. |
| `src/modules/llm/services/llm-agent.service.ts` | `onModuleInit` + `generateReply`; invoca o grafo. |
| `src/modules/llm/tools/create-product-tools.ts` | Define `get_product_by_id` e `get_product_by_barcode`. |
| `src/modules/llm/graph/wms-chat.graph.ts` | `buildWmsChatGraph` — `bindTools`, `ToolNode`, nós, arestas, `compile`. |
| `src/modules/llm/llm.constants.ts` | `WMS_CHAT_SYSTEM_PROMPT` e default do modelo. |

---

*Última atualização alinhada ao grafo agent ↔ tools com `toolsCondition` e `MessagesAnnotation`.*
