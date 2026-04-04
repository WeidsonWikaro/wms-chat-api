# Tamanho de chunks para RAG — o que considerar e como dividir

Este documento explica, de forma didática, **como pensar no tamanho dos chunks** ao preparar documentos para recuperação semântica (RAG) com embeddings e bancos como PostgreSQL + pgvector.

Não existe uma fórmula única “oficial” que funcione em todos os projetos. O que existe é um **conjunto de limites reais**, **boas práticas** e **ajuste por testes**.

---

## 1. O que é um chunk?

Um **chunk** (pedaço) é um **trecho de texto** do documento original que:

1. Será transformado num **vetor** (embedding) numa chamada ao modelo de embeddings.
2. Será armazenado no banco (por exemplo com `pgvector`) para depois ser **recuperado** quando o usuário fizer uma pergunta parecida em significado.

Se o documento for um manual de 200 páginas, não faça o embedding do manual inteiro num único vetor (veja as seções seguintes). Divida em **vários chunks**, cada um com o seu vetor.

---

## 2. Três ideias que você não deve confundir


| Conceito                              | O que limita                                                         | Para que serve na prática                                                                                                                 |
| ------------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Limite do modelo de embeddings**    | Tamanho máximo do **texto de entrada** por chamada (em tokens).      | Define o **teto duro**: nenhum chunk pode ser maior do que isso (com margem de segurança).                                                |
| **Dimensão do vetor**                 | Número fixo de números no embedding (ex.: 768, 1536).                | Define a coluna `vector(N)` no Postgres; **não** é o “tamanho do chunk”.                                                                  |
| **Janela de contexto do LLM de chat** | Quanto texto cabe no prompt quando o modelo **responde** ao usuário. | Limita **quantos** chunks recuperados, pergunta e instruções você envia **juntos**; não define sozinha o tamanho ideal de **cada** chunk. |


**Resumo:** ao **criar** chunks, o que mais importa é o **modelo de embeddings**. O modelo de **chat** entra depois, na hora de montar o prompt com os trechos encontrados.

---

## 3. Por que não usar um chunk “do tamanho da janela do chat”?

A janela do modelo que **gera** a resposta (Gemini, GPT, etc.) é grande em muitos casos. Se cada chunk for gigante:

- O vetor representa **muitos temas misturados** → a busca por similaridade fica **menos precisa**.
- Em RAG o objetivo é recuperar **o trecho certo**, não um capítulo inteiro por chunk.

Por isso o tamanho útil do chunk costuma ser **bem menor** que o máximo técnico do modelo de embeddings — não é obrigatório encostar no limite.

---

## 4. O que usar para “calcular” o tamanho médio do chunk

Pense em **camadas**. Não há um único número mágico; há **restrições** e **objetivos**.

### 4.1. Teto duro: modelo de embeddings

- Cada API de embeddings informa **quantos tokens** (no máximo) você pode enviar **por requisição**.
- Cada chunk deve caber **numa única** chamada de embedding.
- **Regra prática:** use **80–90%** desse máximo, nunca 100% “no limite” — tokenização, espaços e idioma (português vs inglês) alteram a contagem.

#### Onde ver o limite de tokens (exemplo: Gemini / Google)

No ecossistema Gemini, o lugar **mais direto** para ver limites por modelo (incluindo modelos de **embedding**) costuma ser o catálogo unificado de modelos:

1. **Página *Modelos* (recomendada)**
  Abra **[Modelos | Gemini API](https://ai.google.dev/gemini-api/docs/models?hl=pt-br)** (`ai.google.dev/gemini-api/docs/models?hl=pt-br`).  
   Role até a seção **“Modelos de tarefas especializadas”** (ou equivalente na versão atual do site): lá aparecem entradas como **Embedding do Gemini** e **Gemini Embedding 2** (pré-lançamento), com a **documentação detalhada de cada modelo** — é nessa ficha do modelo que o Google consolida informações como **limite de tokens de entrada** (e dimensões do vetor, quando aplicável). Use sempre o modelo que você chama no código (`embedContent` / SDK) e confira o número **na própria página desse modelo**.
2. **Página só de embeddings (complementar)**
  A guia **[Embeddings](https://ai.google.dev/gemini-api/docs/embeddings?hl=pt-br)** explica uso da API, exemplos e versões; os **números oficiais de limite** podem repetir-se ali, mas a navegação que muitos desenvolvedores acham mais clara é mesmo a lista **Modelos** acima.
3. **Contagem de tokens (conceito, não o limite)**
  A página **[Contagem de tokens](https://ai.google.dev/gemini-api/docs/tokens?hl=pt-br)** ajuda a entender **como** os tokens são contados; o **teto em tokens por requisição** para o seu chunk vem da **ficha do modelo de embedding** na documentação de **Modelos**, não desta página isoladamente.

**Exemplos numéricos** costumam aparecer na ficha de cada modelo (valores podem mudar): por exemplo, modelos como `gemini-embedding-001` e `gemini-embedding-2-preview` já apareceram com limites de entrada da ordem de **2.048** e **8.192** tokens — **confira sempre** na documentação vigente do modelo escolhido.

**Conclusão:** o tamanho máximo do chunk (em tokens) está **ligado ao modelo de embeddings**, não ao LLM de chat.

### 4.2. Objetivo semântico: unidade de significado

O chunk deve ser **o menor bloco que ainda faça sentido sozinho**:

- **Pequeno demais** → perde contexto (“este procedimento” sem dizer qual).
- **Grande demais** → mistura temas; o vetor fica genérico e a **recuperação** (retrieval) piora.

Por isso o “tamanho médio” certo é um **compromisso** entre caber no modelo de embeddings e **representar uma unidade de informação** (parágrafo, seção, artigo curto).

### 4.3. Orçamento no prompt de resposta (LLM de chat)

Depois da busca, você junta **vários** chunks ao prompt (por exemplo os 5 mais parecidos com a pergunta). Em termos grosseiros:

```text
tokens ≈ (instruções + pergunta) + k × (tamanho_médio_do_chunk)
```

Isso precisa caber na **janela do modelo de geração** (com margem). Isso **não** define o chunk ideal sozinho, mas evita chunks tão grandes que **só com k = 1** você já enche a janela.

---

## 5. Regras para **dividir** o texto do jeito mais “certo” possível

A melhor divisão **não é só “cortar a cada N caracteres”**. A ordem habitual é:

### Regra 1 — Estrutura primeiro

Divida onde o documento já tem **estrutura**:

- Markdown: por cabeçalhos (`#`, `##`).
- Texto corrido: por **parágrafos** (quebras duplas `\n\n`).
- Código: por **função** ou **arquivo**, quando fizer sentido.

Assim você **reduz** cortes no meio de uma ideia.

### Regra 2 — Divisão recursiva com separadores (padrão “recursive character”)

Se um bloco estrutural ainda for **maior** que o seu teto em tokens, vá **subdividindo** usando uma ordem de separadores, por exemplo:

1. `\n\n` (parágrafos)
2. `\n` (linhas)
3. `.`  (frases)
4. espaço (palavras)

Esse é o padrão de muitas bibliotecas (ex.: `RecursiveCharacterTextSplitter` no ecossistema LangChain): tenta respeitar **limites naturais** do texto.

### Regra 3 — Contar em **tokens**, não só em caracteres

- **Caracteres** variam muito (PT vs EN, acentos, código).
- O limite da API de embeddings é em **tokens**.
- O ideal é usar o **mesmo tipo de contagem** que o modelo (ou uma biblioteca de tokenização compatível).

### Regra 4 — Sobreposição (*overlap*)

Entre chunks consecutivos, mantenha uma **sobreposição** (por exemplo 10–20% do tamanho do chunk, ou 50–150 tokens):

- Evita que uma frase importante fique **cortada** na fronteira entre dois chunks e que **nenhum** dos dois seja bem encontrado na busca.

### Regra 5 — Se ainda for grande, corte até caber

Depois de respeitar estrutura e sobreposição, qualquer pedaço que **ainda** ultrapasse o teto do modelo de embeddings é **subdividido** até cada parte respeitar o limite.

---

## 6. Pontos de partida típicos (valores iniciais, não verdades absolutas)


| Tipo de conteúdo                 | Ponto de partida comum                                                               |
| -------------------------------- | ------------------------------------------------------------------------------------ |
| Documentação, políticas, manuais | **256–512 tokens** por chunk (512 é um **valor padrão** muito usado antes de afinar) |
| FAQs muito curtas                | Chunks **menores**                                                                   |
| Código                           | Por unidade lógica + **teto** em tokens                                              |


Ajuste com base em **testes** (seção seguinte).

---

## 7. Como chegar mais perto do “valor certo” no seu projeto

A forma mais séria de afinar:

1. Monte um conjunto de **perguntas reais** que os usuários fariam (dezenas a centenas).
2. Para cada pergunta, verifique se os **chunks certos** aparecem entre os **k primeiros resultados** (ex.: *top 5*).
3. Se faltar contexto → experimente chunks **um pouco maiores** (dentro do teto do modelo de embeddings).
4. Se aparecer muito texto irrelevante → experimente chunks **menores** ou uma estrutura de separadores melhor.

Sem essa avaliação, os valores da tabela acima já são uma **base segura** para começar.

### 7.1. Na prática: o que você precisa preparar


| Item                                             | Descrição                                                                                                                                                                                                          |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Chunks indexados**                             | Cada linha na tabela `document_chunks` (ou equivalente) com `id` único, `content`, `embedding` e, se possível, `document_id` / `fonte` na metadata. Sem ids estáveis, fica difícil dizer “qual chunk era o certo”. |
| **Mesmo modelo de embedding**                    | O modelo usado na **avaliação** deve ser o **mesmo** da ingestão e da produção; senão os vetores não são comparáveis.                                                                                              |
| **Conjunto de avaliação (perguntas + gabarito)** | Uma lista de perguntas; para cada uma, o **id do chunk** onde a resposta está (ou uma lista de ids aceitáveis, se a informação estiver em mais de um trecho).                                                      |


**Como obter o “chunk certo” (gabarito)?**

- **Rotulagem manual (começo):** aqui **“manual”** significa **feito por você (ou por alguém), com julgamento humano** — não é um script que descobre sozinho o chunk certo. Na prática costuma ser **digital**: planilha (Excel/Google Sheets), CSV ou formulário onde você cola ou seleciona o **id** do chunk esperado. Papel e caneta só se preferir anotar rascunhos; o gabarito final para o script de avaliação é quase sempre **arquivo no computador**. É trabalhoso, mas é o método mais claro.
- **Semi-automático:** para cada pergunta, faça uma busca *full text* ou uma primeira busca vetorial, corrija o `id` na planilha — útil para escalar um pouco.
- **Versão mínima:** comece com **20–50** perguntas bem escolhidas; já permite ver se o *hit@5* melhora ou piora quando você muda tamanho de chunk ou separadores.

Formato simples para o conjunto (ex.: CSV ou JSON):

```text
pergunta,id_chunk_esperado
"Como devolver mercadoria danificada?","uuid-do-chunk-que-contém-a-política"
```

Se uma pergunta puder ser respondida por **vários** chunks equivalentes, use uma coluna `ids_aceitáveis` (lista) e considere “acerto” se **qualquer** deles aparecer no *top-k*.

### 7.2. Na prática: fluxo de avaliação (offline)

Para **cada** linha do conjunto de avaliação:

1. **Gere o embedding da pergunta** com a mesma API/modelo usados para os chunks.
2. **Consulte o banco** (ex.: PostgreSQL + pgvector): ordene por similaridade (coseno ou `<=>`) e pegue os **k** primeiros `id` de chunk — por exemplo `k = 5` ou `k = 10`.
3. **Compare** com o gabarito: o `id_chunk_esperado` (ou um dos `ids_aceitáveis`) está nessa lista?
4. **Registre** acerto (1) ou erro (0) para essa pergunta.

Isso pode ser um **script** (Node/TypeScript, Python, etc.) que roda no seu PC ou em CI, **sem** precisar chamar o LLM de chat: só embedding + SQL. Opcionalmente, no fim, você pode mandar ao LLM só os casos que falharam para inspecionar se o problema foi retrieval ou geração — mas para **afinar chunk**, o passo 1–3 basta.

### 7.3. Métrica simples: *hit@k*

- **hit@k** = fração de perguntas em que o chunk correto aparece entre os **k** primeiros resultados da busca vetorial.  
Ex.: 40 perguntas, 32 acertos com *k = 5* → **hit@5 = 80%**.
- Rode a mesma bateria **antes e depois** de mudar tamanho de chunk, overlap ou separadores; compare **hit@k** (e, se quiser, a **posição média** do chunk certo quando ele aparece: 1º é melhor que 5º).

Não é obrigatório usar bibliotecas de *benchmark*; uma planilha com as colunas `pergunta | acertou (s/n) | posição do chunk certo` já funciona.

### 7.4. Como interpretar e ajustar (ligação com os itens 3 e 4)


| Sintoma na avaliação                                                  | O que experimentar                                                                                                                                                                                                                                                                                         |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Chunk certo **não entra** no *top-k* (ou entra muito embaixo)         | Chunks **maiores** (até o teto do embedding) para não partir o contexto; melhor **divisão estrutural** (parágrafos/cabeçalhos); verificar se o texto da pergunta e o do chunk usam as mesmas palavras-chave (sinônimos podem exigir reformular a pergunta de teste ou *query expansion* — tópico à parte). |
| Chunk certo entra, mas vêm **muitos** trechos irrelevantes no *top-k* | Chunks **menores** ou mais focados; reduzir ruído na ingestão (cabeçalhos repetidos, rodapés); considerar *reranking* depois (fora do escopo mínimo de chunk).                                                                                                                                             |
| Resultado bom no *hit@k* mas resposta do LLM ainda ruim               | Provável problema de **prompt**, **geração** ou **conflito** entre trechos — não de tamanho de chunk isoladamente.                                                                                                                                                                                         |


### 7.5. Onde isso roda no projeto

- **Script local:** lê o CSV/JSON de perguntas, usa a mesma chave/API do Gemini para embeddings e `SELECT … ORDER BY embedding <=> $vetor_da_pergunta LIMIT k` (ou equivalente).
- **Teste automatizado:** pode ser um teste de integração que sobe um banco de teste com poucos chunks fixos e valida *hit@k* em cima de 5–10 perguntas — útil para **regressão** quando alguém mudar o splitter.

Reexecute a avaliação sempre que mudar **modelo de embedding**, **estratégia de chunk** ou **conteúdo** indexado em massa.

---

## 8. Checklist rápido

- Confirmei o **máximo de tokens por requisição** do **modelo de embeddings** e deixei **margem**.
- Defini tamanho alvo em **tokens** (não só caracteres).
- Divido primeiro por **estrutura** (parágrafos / cabeçalhos), depois por divisão recursiva se precisar.
- Uso **sobreposição** entre chunks vizinhos.
- Verifico de forma grosseira que **k** chunks + pergunta cabem na janela do **LLM de geração**.
- (Opcional, mas recomendado) Valido com **perguntas de teste**, métrica **hit@k** e gabarito de chunks (ver **§7**).

---

## 9. Em uma frase

O tamanho do chunk deve respeitar o **limite do modelo de embeddings** com margem, preferir **unidades de significado** com **divisão estrutural** e **sobreposição**, e ser **afinado** com perguntas reais — não basta copiar a *context window* do modelo de chat.