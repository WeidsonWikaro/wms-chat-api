# ESTUDOS — Entrevista Analista Full Stack + IA

Documento de preparação técnica (Next.js, NestJS, RabbitMQ, RAG/LangChain/LangGraph/LangSmith, pgvector/PostgreSQL, AWS). Cada tópico segue **Didática** (analogia rápida), **Resposta** (o que falar na entrevista) e **Explicação** (aprofundamento).

---

## Índice

1. [Parte 1 — Stack principal (Didática / Resposta / Explicação)](#parte-1--stack-principal-didática--resposta--explicação)
2. [Parte 2 — NestJS aprofundado (14 tópicos)](#parte-2--nestjs-aprofundado-14-tópicos)
3. [Parte 3 — Tópicos adicionais](#parte-3--tópicos-adicionais)

---

## Parte 1 — Stack principal (Didática / Resposta / Explicação)

### Next.js

#### App Router vs Pages Router

**Didática:** Pages era “um arquivo, uma página”; App Router é “uma pasta, um conjunto de responsabilidades (layout, página, loading, erro)”.

**Resposta:** “Migrei mentalmente para App Router: organizo rotas por pastas, uso layouts aninhados e separo claramente o que roda no servidor do que precisa do cliente.”

**Explicação:** No **Pages Router**, a convenção era simples: `pages/foo.tsx` virava `/foo`. O modelo mental era quase todo “React no cliente”, com `getServerSideProps` / `getStaticProps` como exceções para dados. No **App Router**, o arquivo `page.tsx` é só uma parte: você pode ter `layout.tsx` (casca que envolve filhos), `loading.tsx` (Suspense boundary), `error.tsx` (error boundary), `route.ts` (handlers HTTP). O ganho não é só “novo jeito de rotear”: é **modelar a árvore de UI e de dados** de forma explícita. O servidor pode ser o lugar padrão onde dados são buscados, e o cliente vira o lugar da interatividade. Na entrevista, o lead quer ver se você entende **por que** isso existe: menos JavaScript enviado, dados mais perto da origem, melhor segurança para segredos que não devem vazar no bundle.

#### Server Components vs Client Components

**Didática:** Servidor = cozinha; cliente = salão onde o cliente interage. O cardápio (HTML) pode vir pronto da cozinha.

**Resposta:** “Uso Server Components por padrão e `use client` só onde preciso de estado, eventos ou APIs do browser. Isso reduz bundle e mantém secrets no servidor.”

**Explicação:** Em React clássico no browser, **todo** componente “pensa” no ambiente do usuário. Server Components **nunca** rodam no browser daquele jeito: eles rodam no servidor, geram uma representação serializável, e o cliente recebe o resultado. Você **não** usa hooks de estado/efeito neles. Client Components são o React que você já conhece. A confusão comum é achar que “Server = mais rápido sempre”; na verdade, Server é ótimo para **dados estáticos ou lentos** e para **não expor** chamadas internas. Client é obrigatório para digitação, cliques, `useRouter` em certos padrões, bibliotecas que usam `window`. O modelo mental certo: **parcimônia com `use client`** — cada arquivo client aumenta o que vai no JS do usuário.

#### Autenticação: cookie httpOnly vs JWT no localStorage

**Didática:** `localStorage` é um quadro na parede que qualquer script na página pode ler; cookie httpOnly é um cofre que o JavaScript da página não abre.

**Resposta:** “Evito token em localStorage quando há risco de XSS; prefiro cookie httpOnly + SameSite e, se for JWT, validação no backend ou BFF.”

**Explicação:** **XSS** é quando alguém injeta script no seu site. Se o token está no `localStorage`, o script rouba o token e chama sua API como o usuário. Cookie **httpOnly** não é acessível via `document.cookie` no JS da página, então um XSS “vê” menos. **SameSite** reduz envio do cookie em requisições cross-site (ajuda contra CSRF em alguns cenários, dependendo do fluxo). **CSRF** entra quando o browser envia cookie automaticamente em um POST malicioso de outro site — aí entram tokens anti-CSRF, SameSite=Lax/Strict, ou uso cuidadoso de headers. Nenhum modelo é “100% à prova”; a entrevista valoriza você **nomear o ataque** e **dizer o que mitiga**. JWT em cookie ainda é JWT (stateless, expiração, rotação); sessão server-side em cookie é outro modelo (revogação mais simples, mais estado no servidor).

#### Cache, revalidação e dados dinâmicos

**Didática:** Cache é foto; revalidação é acordo de quando tirar foto de novo.

**Resposta:** “Defino o que pode ser estático com revalidação por tempo ou por tag/evento; páginas personalizadas ou em tempo real marco como dinâmicas.”

**Explicação:** No App Router, Next tenta **cachear** fetch e segmentos estáticos quando possível. Isso melhora performance e custo. O problema é conteúdo que muda: aí você usa **dynamic rendering** (`cache: 'no-store'`, segment config, etc.) ou **revalidate** (ISR — regenerar depois de N segundos). **Tags** permitem invalidar um conjunto de cache quando algo muda no admin. Para IA/chat, muita coisa é **por usuário** e **tempo real** — então não dá para cachear a conversa inteira como página pública; mas você ainda pode cachear **partes** (assets, layout, documentação estática). O tech lead percebe se você sabe **onde** o cache ajuda e **onde** mente.

#### Conteúdo vindo da IA (Markdown/HTML) e XSS

**Didática:** Texto da IA é “externo”; tratar como confiável é colar um panfleto na vitrine sem ler.

**Resposta:** “Sanitizo ou uso renderizador de Markdown seguro; não injeto HTML bruto sem whitelist.”

**Explicação:** Se o modelo devolve Markdown e você converte para HTML, um bug na lib ou uma extensão perigosa pode virar XSS. Se devolve HTML “cru”, pior. A prática comum é: **whitelist** de tags, sanitização (ex.: esquema DOMPurify no client, ou sanitizar no server), **CSP** (Content Security Policy) como camada extra. Em entrevista, “eu sanitizo” já mostra maturidade; “confio no modelo” é red flag.

---

### Nest.js (visão geral)

#### Módulos e injeção de dependência

**Didática:** Módulo é gaveta; DI é “eu peço a ferramenta na recepção em vez de ir na fábrica”.

**Resposta:** “Organizo por domínio, registro providers no módulo e injeto interfaces/ports nos serviços para testar com mocks.”

**Explicação:** Nest segue o modelo **Angular-like**: `Module` agrupa `controllers` + `providers`. **Injeção de dependência** resolve implementações por **token** (classe ou string/symbol). O benefício central é **inversão de dependência**: `ChatService` não faz `new OpenAiClient()`; ele recebe `LlmPort`. Em teste, você substitui por fake. Em produção, registra a implementação real. O lead quer ver se você entende **por que** isso escala: mudança de provedor LLM, fila, banco, sem reescrever o core do domínio.

#### Guards, pipes e interceptors

**Didática:** Guard = porteiro; pipe = formatador/validador; interceptor = capa que envolve a resposta (log, tempo, map).

**Resposta:** “Guard para JWT/roles, ValidationPipe para DTOs, interceptor para logging e padronização de resposta.”

**Explicação:** **Guards** rodam **antes** do handler e decidem permitir ou não (`canActivate`). **Pipes** transformam/validam **entrada** (ex.: `class-validator` no body). **Interceptors** envolvem a execução: antes/depois, podem medir tempo, alterar resposta, tratar RxJS em controllers que retornam Observable. A ordem mental: request → middleware (Express) → guard → interceptor (before) → pipe → handler → interceptor (after). Erro comum: misturar **regra de negócio** em guard (às vezes melhor no service). Mostrar que você sabe **onde** cada coisa mora é o objetivo.

#### Exception filters e erros padronizados

**Didática:** Sem filtro, cada sala grita de um jeito; com filtro, todos usam o mesmo interfone.

**Resposta:** “Exception filter global mapeia HttpException e erros de domínio para um JSON consistente e status HTTP correto.”

**Explicação:** APIs boas têm **contrato de erro**: código, mensagem amigável, opcionalmente `details` para validação. `HttpException` do Nest já ajuda; erros “crus” do Node podem vazar stack. O filter captura, loga internamente com stack, e devolve algo **controlado**. Para microserviços, às vezes há **correlation id** no interceptor para rastrear. Didaticamente: pense no **usuário do client** (mensagem útil) e no **operador** (log rico).

#### WebSockets vs SSE (chat / streaming)

**Didática:** SSE = rádio só de ida (servidor → cliente) em cima de HTTP; WebSocket = telefone duplex.

**Resposta:** “Streaming de tokens costumo expor como SSE ou chunked HTTP; para presença bidirecional, WebSocket.”

**Explicação:** **SSE** usa uma conexão HTTP longa; o servidor envia eventos `text/event-stream`. Funciona bem atrás de proxies comuns para **fluxo servidor→cliente**. **WebSocket** é full-duplex, ótimo para muitas mensagens curtas dos dois lados. Para **LLM streaming**, muitas stacks usam SSE ou NDJSON porque o fluxo principal é “modelo fala, UI atualiza”. Escolha não é dogma: firewalls, balanceadores e custo de conexões importam. O importante na entrevista é **não confundir** “tempo real” com “só WebSocket”.

#### Testes unitários vs e2e

**Didática:** Unitário = testar um parafuso; e2e = ligar o carro e sair na rua.

**Resposta:** “Unitário com mocks nas ports; e2e com app real e banco isolado ou container para fluxos críticos.”

**Explicação:** **Unitário** é rápido e localiza bug, mas pode mentir se o mock não reflete a realidade. **E2e** é lento e frágil, mas valida integração (auth, DB, fila fake ou real). O meio-termo saudável: muitos unitários nos **serviços de domínio**, alguns **integration tests** no repositório com DB de teste, e2e nos **caminhos felizes críticos**. Mencionar **Testcontainers** ou pipeline CI ganha pontos se for verdade na sua experiência.

---

### RabbitMQ

#### Exchanges: direct, topic, fanout

**Didática:** Direct = entrega na fila certa pelo “endereço exato”; topic = endereço com curinga; fanout = xerox para todas as filas ligadas.

**Resposta:** “Escolho o tipo pelo padrão de roteamento: fanout para broadcast, topic para assinaturas por padrão de chave, direct para filas simples.”

**Explicação:** No AMQP, produtores **não mandam direto na fila** (na maioria dos desenhos): mandam para um **exchange** com uma **routing key**. O **binding** diz “esta fila aceita estas chaves”. **Direct** casa chave exata. **Topic** permite padrões (`orders.*`, `orders.#`). **Fanout** ignora routing key para distribuição ampla. Didaticamente: exchange é a **central de triagem**; sem entender binding, Rabbit parece “mágico”. Na entrevista, desenhar **produtor → exchange → fila → consumidor** já mostra clareza.

#### At-least-once e idempotência

**Didática:** O carteiro pode bater duas vezes na porta; sua regra de negócio não pode “cobrar duas vezes o mesmo boleto”.

**Resposta:** “Trato mensagens como possivelmente duplicadas: chave idempotente, upsert ou tabela de processados.”

**Explicação:** RabbitMQ em configurações comuns oferece **at-least-once**: confirmação (`ack`) depois do processamento, mas **reconnect**, **redelivery** ou bug podem reenviar. **Exactly-once de ponta a ponta** entre sistemas distribuídos é raro e caro; o padrão da indústria é **idempotência no consumidor**. Implementações: `messageId` único gravado em tabela com constraint; **outbox pattern** no produtor para não perder evento; **dedup** com TTL. O lead quer ouvir que você **não assume** “uma vez só” só porque publicou uma vez.

#### DLQ, retry e poison message

**Didática:** Poison message é a música que trava o toca-fitas; DLQ é a gaveta onde você guarda o disco ruim para analisar depois.

**Resposta:** “Retry com limite e backoff; mensagens que falham sempre vão para DLQ com contexto para inspeção.”

**Explicação:** Sem política, um payload inválido **loopa** infinitamente, saturando logs e atrasando a fila. Padrão: **N tentativas** com espera crescente; depois **dead-letter** (fila ou exchange DLX). Operacionalmente, DLQ é fila de **triagem humana** ou job de correção. Didaticamente: distinguir **erro transitório** (rede, timeout) de **permanente** (schema errado) — o segundo não deve retry agressivo.

#### Ordem e particionamento

**Didática:** Duas caixas atendendo o mesmo cliente ao mesmo tempo podem inverter “criar” e “cancelar”.

**Resposta:** “Se preciso ordenar por entidade, uso uma fila por chave ou particiono consumidores com hash; caso contrário paralelizo.”

**Explicação:** Filas **não garantem ordem global** entre múltiplos consumidores da mesma fila de forma trivial — mensagens são distribuídas. Se **orderId** precisa ser processado em sequência, opções: **uma fila por agregado** (pode explodir número de filas), **single consumer** por partição, ou **lock** no domínio. Trade-off: paralelismo vs ordem. Entender isso evita prometer “Rabbit garante ordem sempre” na entrevista.

#### Evento vs comando

**Didática:** Comando = “faça isso agora”; evento = “isso aconteceu, quem quiser reage”.

**Resposta:** “Eventos para desacoplar bounded contexts; comandos quando preciso de ação síncrona e confirmação.”

**Explicação:** **Comando** implica intenção e muitas vezes **um** handler responsável. **Evento** é fato passado; pode haver **vários** consumidores (email, índice, analytics). Mensageria mal modelada vira “RPC disfarçado” com filas — funciona, mas perde benefícios. Versionamento: eventos costumam ter `eventType` + `version` para evolução sem quebrar consumidores antigos.

---

### LLM + RAG + pgvector + PostgreSQL

#### O que é RAG (visão completa)

**Didática:** Em vez de pedir para o modelo “lembrar” tudo, você cola na frente dele os parágrafos certos do manual.

**Resposta:** “Indexo documentos com embeddings, recupero os trechos mais relevantes e injeto como contexto com instruções para fundamentar a resposta.”

**Explicação:** LLM tem **limite de contexto** e **conhecimento cortado no treinamento**. RAG (**Retrieval-Augmented Generation**) separa em duas fases: (1) **retrieval** — achar pedaços úteis da base; (2) **generation** — o modelo redige usando esses pedaços. Sem RAG, o modelo **alucina** ou desatualiza. Com RAG mal feito, ele **alucina com confiança** porque o contexto é ruim. Por isso retrieval não é detalhe: é metade do produto. **pgvector** guarda vetores no Postgres junto com dados relacionais — útil para **filtros** (empresa, permissão, data) na mesma query.

#### Chunking e overlap

**Didática:** Livro sem capítulos vira parede de texto; overlap é repetir a última frase do capítulo no começo do próximo para não cortar ideia.

**Resposta:** “Ajusto tamanho do chunk pelo tipo de documento; uso overlap para não perder contexto nas fronteiras.”

**Explicação:** Chunks **grandes** trazem ruído e estouram contexto; **pequenos** perdem definições que estão na frase anterior. **Overlap** (ex.: 10–20% do tamanho) aumenta chance de qualquer pedaço “completo” estar em algum chunk. Documentos estruturados (Markdown com headings) permitem chunk **semântico** (por seção) em vez de só por tamanho fixo. Na entrevista, mencionar **metadados** (título, página, url) ajuda debug e citações.

#### Similaridade vetorial e `top_k`

**Didática:** Pergunta e documento viram pontos no espaço; os “vizinhos mais próximos” são os mais parecidos.

**Resposta:** “Calculo embedding da query, busco top_k por similaridade, e filtro por tenant/regras no SQL quando aplicável.”

**Explicação:** **Embedding** é mapeamento texto → vetor de floats. **Similaridade** (cosseno, produto interno, L2) mede “quão perto” estão. **top_k** baixo = contexto estreito (pode faltar info); alto = ruído e custo. **Threshold** de similaridade pode descartar resultados fracos (“não sei” é melhor que inventar). **Híbrido** = BM25/TSVECTOR + vetor (Postgres full text + pgvector) quando palavras-chave importam tanto quanto paráfrase.

#### Falha de retrieval e alucinação

**Didática:** Se o manual não tem a página, o funcionário não deve inventar o regulamento.

**Resposta:** “Se não há contexto relevante ou score baixo, respondo com limitação ou pergunta de esclarecimento; ajusto prompt para não preencher lacunas.”

**Explicação:** Modelos são treinados para **ser úteis**, o que inclui **completar** lacunas — isso vira alucinação em produto. Mitigações: prompt explícito (“use apenas o contexto; se vazio, diga que não sabe”), **citações** forçadas, **validação** pós-geração (checar se afirmações têm suporte no contexto), **classificador** de “resposta suportada”. Operação: métricas de “empty retrieval rate” e qualidade humana em amostras.

#### Custo, latência e cache

**Didática:** Cada token é microcentavo; cada round-trip soma; cache é “já calculei isso antes”.

**Resposta:** “Cache de embeddings para docs estáveis, cache de resposta com TTL quando seguro, e modelos menores para triagem.”

**Explicação:** **Embedding** de um documento gigante uma vez e reutilizar é óbvio; embedding da **mesma pergunta** repetida (FAQ) também. **Cache de resposta** só onde não há risco de dados sensíveis cruzados entre usuários (**chave** inclui user/tenant). **Roteamento**: modelo barato classifica intenção; modelo caro só no fluxo difícil (**routing**). Observabilidade: tokens por request, latência por etapa — sem isso você otimiza no escuro.

---

### LangChain / LangGraph / LangSmith

#### LangChain (chains, tools, LCEL)

**Didática:** Chain é receita; tool é “permissão para o modelo usar calculadora/API com regra”.

**Resposta:** “Encapsulo passos reutilizáveis e exponho tools com schema claro para chamadas seguras a APIs e buscas.”

**Explicação:** **LangChain** agrega **abstrações** para prompts, parsers, memória, vector stores, agents. **LCEL** (LangChain Expression Language) compõe com tipo/streaming de forma mais explícita que “encadear strings”. **Tools** são funções com **descrição** para o modelo escolher; o risco é dar tool perigosa sem validação — na entrevista, falar em **allowlist**, timeouts, e validação de argumentos mostra senso de produção.

#### “Memória” em chat

**Didática:** Memória infinita é como gravar todas as conversas no quadro — fica ilegível e caro.

**Resposta:** “Persisto histórico com limite de janela ou resumo; versiono prompts; cuidado com PII em logs.”

**Explicação:** Contexto longo **aumenta custo** e **dilui atenção** do modelo (modelos “esquecem” o meio). Padrões: **buffer** com últimas N mensagens, **resumo** assíncrono, **memória estruturada** (fatos confirmados). Em produto multiusuário, memória é **dado** — LGPD, retenção, exclusão. LangChain dá atalhos, mas o desenho é **seu**.

#### LangGraph

**Didática:** LangChain linear é roteiro; LangGraph é **fluxograma** com voltas controladas.

**Resposta:** “Uso grafo quando há ramificações, revisão humana ou loops até critério de qualidade; estado explícito facilita debug.”

**Explicação:** **Grafo** tem **nós** (funções), **arestas** (transições), **estado** compartilhado tipado. Útil para: **agente** que pode pesquisar várias vezes, **human-in-the-loop** (aprovar antes de enviar email), **critique-rewrite**. Sem grafo, `while` e flags viram espaguete. Na entrevista, não precisa ser doutor: “estado + arestas condicionais + limite de iterações” já comunica maturidade.

#### LangSmith

**Didática:** É o raio-X de cada execução: entrou o quê, qual prompt final, quanto custou, onde quebrou.

**Resposta:** “Traces para debug; datasets para regressão de prompts; comparo versões e modelos antes de deploy.”

**Explicação:** LLM é **não determinístico** (mesmo com temperatura baixa). **Observabilidade** vira obrigatória: inputs, retrieved docs, prompt montado, output, latência, tokens, erros. **Evals** repetíveis (dataset + métrica humana ou automática) evitam “melhorou no feeling”. **Regression** = nova versão do prompt não pode quebrar casos que já passavam. Smith integra esse ciclo; o conceito vale mesmo se a ferramenta for outra.

#### Debug dos 2% de falha

**Didática:** Bug raro em LLM quase sempre é dado sujo, retrieval ruim ou instrução ambígua — não “fantasma”.

**Resposta:** “Reproduzo com o mesmo input, inspeciono retrieval e prompt no Smith, classifico se é dados, prompt ou ferramenta; adiciono caso ao dataset.”

**Explicação:** Processo: (1) isolar **input**; (2) ver **contexto recuperado**; (3) ver **prompt final**; (4) ver **tool calls**; (5) comparar com run bom. Muitas vezes o fix é **threshold**, **chunk**, ou **uma linha no prompt**. Cultura de **adicionar ao golden set** transforma incidente em qualidade acumulada.

---

### AWS (visão conceitual)

#### Lambda vs ECS/Fargate

**Didática:** Lambda é “funcionário por tarefa rápida”; ECS é “loja com plantão fixo que você escala”.

**Resposta:** “Lambda para cargas event-driven curtas; containers quando preciso conexões longas, WebSocket ou workers pesados.”

**Explicação:** **Lambda** tem limites de tempo, cold start, modelo de concorrência; é excelente para **ETL leve**, webhooks, fan-out. **ECS/Fargate** roda **containers** sempre ligados — melhor para APIs com tráfego constante, **state**, libs pesadas. **EKS** entra se a empresa já é Kubernetes-first. O lead quer **critério de escolha**, não fanatismo.

#### RDS PostgreSQL

**Didática:** Você aluga o motor do carro mantido; ainda é seu trabalho modelar bem a corrida.

**Resposta:** “Uso RDS para Postgres gerenciado com backup e HA conforme tier; aplico migrações versionadas e índice para vetor com pgvector.”

**Explicação:** **RDS** abstrai SO, patch em parte, backups; **você** ainda define schema, índices, queries lentas, connection pool (PgBouncer etc.). **Read replica** ajuda leitura; **lag** existe. **pgvector** precisa de índice apropriado (IVFFlat/HNSW conforme versão/config) em bases grandes — citar isso mostra que você pensa em escala.

#### S3 + IAM + secrets

**Didática:** S3 é armário; IAM é crachá com salas mínimas; secret no código é chave colada na porta.

**Resposta:** “Secrets em Parameter Store/Secrets Manager, buckets privados, policies least privilege por serviço.”

**Explicação:** **IAM** é o coração da segurança AWS: roles para serviço, não usuário long-lived na máquina. **S3** com encryption, block public access, lifecycle para custo. **Secrets** rotacionados quando possível. Em entrevista, “nunca commito chave” + **onde** guarda já é baseline sólido.

#### SQS vs RabbitMQ

**Didática:** Os dois entregam mensagens; um é serviço AWS “absorvendo operação”; outro é produto flexível com AMQP.

**Resposta:** “Rabbit quando preciso de routing rico e já tenho operação; SQS quando quero simplicidade e integração nativa com Lambda/SNS.”

**Explicação:** **SQS** é fila gerenciada, forte em **simplicidade** e integração; semântica e features diferem de AMQP. **Rabbit** oferece exchanges, padrões clássicos de enterprise. Migração e **observabilidade** mudam. Mostrar que entende **trade-off operacional** é mais valioso que “um é melhor”.

---

### Perguntas de sistema inteiro

#### Fluxo ponta a ponta

**Didática:** Cada caixa resolve um problema: UI fala humano, API valida e orquestra, fila desacopla pico, worker processa pesado, DB guarda verdade, LLM gera texto.

**Resposta:** “Cliente Next chama API Nest; Nest publica evento/job no Rabbit; worker consome, monta query no pgvector, chama LLM, persiste resposta e notifica via SSE/WebSocket ou polling.”

**Explicação:** O padrão típico: **requisição HTTP** não pode segurar **minutos** de processamento síncrono; por isso **fila** absorve picos e permite **retry**. O **worker** pode escalar independente da API. **Postgres** guarda estado (usuário, conversa, permissões) e vetores. **LLM** é stateless no sentido de “cada chamada é um post”; por isso você persiste histórico. **Next** pode ser só UI ou também BFF que esconde chaves. O tech lead ouve para ver **acoplamento**, **falhas**, **consistência eventual** onde a fila existe.

#### Onde está o gargalo

**Didática:** Não adianta trocar o volante se o freio está travado — medir cada trecho da pista.

**Resposta:** “Instrumento cada etapa: fila, DB, embedding, LLM; normalmente LLM e I/O dominam.”

**Explicação:** Perfil típico: **latência do modelo** > **retrieval** > **serialização** > **rede interna**. **Throughput** da fila pode ser gargalo se consumidores forem poucos. **Postgres** sem índice vira scan. **Cold start** em Lambda vira problema em tráfego espiky. Didaticamente: liste **cadeia de dependências** e meça **p50/p95** por etapa — otimizar p95 é o jogo.

#### Escalar workers sem efeito duplicado

**Didática:** Mais garçons servindo a mesma mesa sem regra = dois pratos para o mesmo pedido.

**Resposta:** “Idempotência e chaves naturais; transações para marcar processamento; locks só no hot spot.”

**Explicação:** Escala horizontal **multiplica** chance de corrida. Soluções: **idempotency key**, **unique constraint**, **SELECT FOR UPDATE** pontual, **outbox** no produtor. Evitar lock gigante que vira serialização total. O lead quer **consistência** sem matar **paralelismo**.

#### Falha de Postgres ou Rabbit

**Didática:** Sistema distribuído = peça quebra; pergunta é “degrada com segurança ou para tudo?”.

**Resposta:** “Health checks, circuit breaker, mensagens voltam à fila com cuidado, modo degradado só se negócio permitir.”

**Explicação:** Se **Rabbit** cai, produtor pode **bufferizar** (cuidado com memória), **falhar rápido** com erro claro, ou **persistir outbox** até voltar. Se **Postgres** cai, worker **nack/requeue** com limite para não loop. **Degradação**: responder sem RAG (com aviso) vs erro — decisão de produto. **Observabilidade** e **runbooks** completam a resposta madura.

#### Mudança de modelo de embedding

**Didática:** Trocar a régua com que você mede “parecido” invalida o mapa antigo — precisa remapear.

**Resposta:** “Versiono embeddings, reindexo em job, leio pela versão ativa por coleção/tenant, com rollout gradual.”

**Explicação:** Vetores de modelos diferentes **não são comparáveis** no mesmo espaço. Estratégias: coluna `embedding_v2`, **backfill** assíncrono, **dual write** durante migração, feature flag por tenant. Na entrevista, mostrar **zero downtime** e **rollback** impressiona mais que “rodo de novo e pronto”.

---

## Parte 2 — NestJS aprofundado (14 tópicos)

### 1. Módulos (`@Module`) e fronteiras do sistema

**O que é:** No Nest, quase tudo “morre” dentro de um **módulo**: controllers, services, repositories, clients externos. O módulo diz **o que é público** (`exports`) e **o que esse pacote precisa** (`imports`).

**Por que existe:** Sem módulos, um projeto Node grande vira **importação cruzada infinita**. Módulo é uma **fronteira**: “este conjunto de classes forma um **contexto**”.

**Vantagens:** Organização por domínio; encapsulamento; substituição de implementação; testes com `TestingModule` menor.

**Desvantagens / custos:** Cerimônia; `@Global()` mal usado vira acoplamento invisível; imports circulares (sinal de desenho torto).

**Quando usar:** Sempre que o projeto **passa de alguns arquivos**. Regra: **um módulo por bounded context**.

**Motivo (entrevista):** “Nest traz estrutura enterprise sem reinventar padrão a cada empresa.”

---

### 2. Injeção de dependência (DI)

**O que é:** Você não faz `new EmailService()` dentro de `UserService`. Declara no construtor e o Nest injeta a implementação registrada.

**Por que existe:** Inversão de dependência (SOLID): regra de negócio não depende de detalhe (SMTP vs SendGrid), depende de **contrato**.

**Vantagens:** Teste com mock; troca de implementação; ciclo de vida (singleton vs REQUEST — com cuidado).

**Desvantagens:** Curva mental (token, `useClass` vs `useFactory`); factories complexas; request-scoped abusado mata performance.

**Por que não só `new`:** Testes piores, troca de lib exige editar classe de negócio, dependências escondidas. Construtor com DI é **índice honesto** do que a classe precisa.

**Frase madura:** “DI é ponto de extensão e ponto de teste.”

---

### 3. Controllers — fino vs grosso

**O que é:** Controller recebe HTTP, valida formato (DTO), chama serviço, devolve status/corpo.

**Por que separar de Service:** HTTP é detalhe de entrega; amanhã pode ser CLI, worker, GraphQL.

**Vantagens:** Controller legível; service reutilizável pelo consumer da fila.

**Se errar:** Controller gordo duplica lógica; service vira God class.

**Motivo:** “Controller é adaptador de entrada; service é aplicação/domínio.”

---

### 4. DTOs + `ValidationPipe`

**O que é:** DTO = forma do JSON + regras (`class-validator`). `ValidationPipe` → 400 antes da lógica.

**Por que:** Sem isso, `if (!body.email)` em cada rota — inconsistente e inseguro.

**Vantagens:** Contrato explícito; erro consistente; menos código imperativo.

**Desvantagens:** DTO não é entidade — pode precisar mapeamento; validação de **negócio** (“e-mail já existe”) fica no service.

**Motivo:** “Validação na borda barata; regra cara fica onde tem transação.”

---

### 5. Guards — autenticação e autorização

**O que é:** Roda **antes** do handler: permitir ou negar; típico JWT + roles.

**Por que não no controller linha 1:** Repetição e esquecimento = brecha.

**Vantagens:** Declarativo (`@UseGuards`); composição.

**Cuidados:** Guard com negócio pesado duplica service; guard mal testado = falsa segurança.

**Motivo:** “Guard: quem é e pode entrar na rota em geral. Autorização fina no service com contexto do recurso.”

---

### 6. Interceptors

**O que é:** Envolvem handler: log, tempo, transformar resposta, timeout, correlation id.

**Por que:** Comportamento **transversal** sem poluir cada método (ideia AOP).

**Vantagens:** DRY para logging/métricas; envelope de resposta padronizado.

**Desvantagens:** “Mágica” para debug; ordem de interceptors importa.

**Motivo:** “Para efeitos que atravessam rotas; regra específica não mora aí.”

---

### 7. Middleware vs Guard vs Interceptor

| | Quando roda | Melhor para |
|---|-------------|-------------|
| **Middleware** | pipeline HTTP cedo | body parser custom, CORS, request id no início |
| **Guard** | após routing, antes do handler | auth, roles |
| **Interceptor** | em volta do handler | log, map response, cache de método |

**Por que cai em entrevista:** Saber que no Nest o padrão de auth costuma ser **Guard**, não “sempre middleware como no Express cru”.

---

### 8. Pipes (além do ValidationPipe)

**O que é:** Transformam entrada: string → number, parse UUID.

**Por que:** Handler recebe tipos corretos sem `parseInt` espalhado.

**Vantagem:** Reuso. **Cuidado:** pipe errado esconde erro de tipo.

---

### 9. Exception filters

**O que é:** Captura exceções → resposta HTTP + log interno.

**Por que:** Sem filtro global, contrato de erro inconsistente e stack vaza.

**Vantagens:** Contrato único; mapeamento domínio → status; segurança (cliente vs operador).

**Desvantagens:** Filtro engole demais e o front não depura — equilíbrio.

**Motivo:** “API madura trata erro como produto.”

---

### 10. Camadas (controller / service / domínio / infra)

**Por que separar:** Testar regra sem DB; trocar ORM; reusar caso de uso no consumer Rabbit.

**Desvantagem de exagerar:** CRUD simples com 5 camadas atrasa entrega.

**Frase:** “Camadas onde a complexidade justifica.”

---

### 11. Nest + RabbitMQ (três jeitos)

**A)** HTTP + publicar na fila — resposta rápida, job assíncrono. **Custo:** UX assíncrona.

**B)** `@nestjs/microservices` + AMQP — padrão uniforme. **Custo:** modelo mental diferente.

**C)** `amqplib` em Provider — controle fino (prefetch, ack). **Custo:** mais código seu.

**Motivo:** “Escolho pela equipe e operação.”

---

### 12. Transações e fila — Outbox (conceito)

**Problema:** Gravar DB e publicar Rabbit sem coordenação → inconsistência.

**Outbox:** Mesma transação grava evento; relay publica com retry.

**Vantagem:** consistência forte. **Custo:** tabela/job extra.

**Entrevista:** Nomear **dual write** e **outbox** ou **sagas**.

---

### 13. Testes — `TestingModule`

**O que é:** Mini-app Nest com providers escolhidos e mocks.

**Por que:** Integração real do DI — pega provider esquecido.

**Desvantagem:** Mais lento que função pura — misturar com unitários sem Nest onde couber.

---

### 14. Por que Nest e não Express puro?

**Resposta sugerida:** “Express é liberdade total; Nest adiciona estrutura opinativa (módulos, DI, pipes/guards/interceptors). **Custo:** boilerplate e curva. **Ganho:** padronização em time, testabilidade, escala humana do código. Para API grande e time plural, Nest compra manutenção com cerimônia.”

---

## Parte 3 — Tópicos adicionais

### TypeScript no backend (Nest)

**Didática:** TypeScript é o **contrato escrito** entre partes do código.

**Resposta:** “TypeScript pega erros cedo, formaliza DTOs e ports, melhora refatoração em time; combina com Nest e DI tipada.”

**Explicação:** Custo de debug de `undefined` em produção > custo de tipos. **Desvantagem:** build mais lento; `any` piora que JS. **Motivo:** escala humana — IDE, rename, contratos na fronteira.

---

### Prisma / TypeORM / query builder

**Didática:** ORM = tradutor objeto↔SQL; SQL cru = língua do banco direto.

**Resposta:** “[seu stack]. ORM acelera CRUD e migrações; pgvector e tuning fino podem exigir raw query com testes.”

**Explicação:** ORM **ganha** produtividade; **perde** em SQL muito específico se o time não olha o gerado.

---

### Migrações e ambientes (expand/contract)

**Didática:** Migração é receita; deploy rolling exige compatibilidade entre versões.

**Resposta:** “Migrações versionadas no CI; expand antes de contract; coluna nullable → backfill → NOT NULL depois.”

**Explicação:** Evita downtime e app antigo quebrando. Erro comum: rename/drop “de uma vez” com clientes antigos no ar.

---

### OpenAPI / Swagger no Nest

**Didática:** OpenAPI é o manual que humanos e ferramentas leem.

**Resposta:** “Swagger module + decorators nos DTOs; contrato para front e client gerado.”

**Explicação:** **Vantagem:** menos ambiguidade. **Desvantagem:** doc mentirosa se não mantida.

---

### Rate limiting e abuso (API / IA)

**Didática:** Sem limite, um ator esvazia carteira e CPU.

**Resposta:** “Limite por IP/usuário/plano; fila; endpoints de LLM mais restritos; headers Retry-After.”

**Explicação:** Gateway + regra de negócio. Com IA: **token budget** por conversa.

---

### Idempotency-Key em HTTP

**Didática:** Número de protocolo — retry não duplica efeito.

**Resposta:** “Header em operações críticas; persistir resultado da primeira execução e devolver igual em retries.”

**Explicação:** Complementa idempotência da fila. **Custo:** storage com TTL.

---

### Paginação: offset vs cursor

**Didática:** Offset “pula 10k linhas” custa caro; cursor continua do marcador.

**Resposta:** “Offset para admin/páginas baixas; cursor (`created_at`, id) para feeds grandes.”

**Explicação:** Offset degrada em tabela grande. Cursor ruim para “ir para página 500”.

---

### N+1 queries e DataLoader

**Didática:** 1 query lista + 1 por item = explosão.

**Resposta:** “Joins/eager conscientes, batch loading; monitorar queries lentas.”

**Explicação:** Clássico com lazy loading em ORM.

---

### JWT: refresh, rotação, revogação

**Didática:** Access curto; refresh mais protegido; revogar JWT stateless é difícil.

**Resposta:** “Refresh em httpOnly; rotação com detecção de reuso; revogação via blacklist/version ou sessão quando necessário.”

**Explicação:** Trade-off estado vs segurança.

---

### OAuth2 / OIDC com Next

**Didática:** Browser não é confiável para decisão final de auth.

**Resposta:** “Troca de code no backend ou validação JWT com JWKS; não confio só no client.”

---

### CORS

**Didática:** Browser bloqueia JS de site A chamando API de domínio B sem cabeçalhos combinados.

**Resposta:** `Allow-Origin` restrito; com credentials não uso `*`.

**Explicação:** CORS é do browser — Postman ignora. `*` + credentials é inválido.

---

### Observabilidade: logs, métricas, traces

**Didática:** Log JSON com `correlationId` é índice; texto solto é sopa.

**Resposta:** “Logs estruturados, métricas p50/p95, traces OpenTelemetry; em IA: tokens/modelo sem PII.”

**Explicação:** Três pilares: logs, métricas, traces.

---

### Feature flags

**Didática:** Interruptor remoto por usuário ou percentual.

**Resposta:** “Rollout gradual e kill switch; backend valida fluxos sensíveis, não só o front.”

**Explicação:** Flag só no front não protege API.

---

### CI/CD

**Didática:** CI é porteiro automático no merge.

**Resposta:** “Lint, testes, build, e2e em PR críticos; Docker; deploy com migração orquestrada.”

---

### Docker: healthcheck (liveness vs readiness)

**Didática:** “Vivo” ≠ “pronto para receber tráfego”.

**Resposta:** “Readiness inclui DB/fila; liveness só processo — evito restart loop se dependência externa cai.”

---

### S3: presigned URL vs upload via backend

**Didática:** Backend como túnel de bytes gasta banda; presigned manda cliente direto ao S3.

**Resposta:** “Presigned após validar permissão; multipart para arquivos enormes.”

---

### SQS + Lambda

**Didática:** Evento acorda Lambda; paga pelo tempo.

**Resposta:** “Cargas irregulares e curtas; evito se preciso conexão longa, estado ou cold start inaceitável.”

---

### VPC, security groups, secrets (AWS)

**Didática:** VPC = condomínio; security group = quem fala com quem.

**Resposta:** “RDS privado; egress controlado; secrets fora do código; IAM least privilege.”

---

### RAG: eval offline vs online

**Didática:** Offline = prova com gabarito; online = mundo real.

**Resposta:** “Dataset com métricas de fidelidade; A/B de prompt; feedback do usuário.”

---

### Chunking semântico vs fixo

**Didática:** Fixo = tesoura; semântico = por seção/título.

**Resposta:** “Por heading quando possível; senão tamanho + overlap; ajusto com traces.”

---

### Re-ranking após retrieval

**Didática:** Vetor sugere candidatos; reranker reordena com mais precisão.

**Resposta:** “k maior + rerank; trade-off latência/custo.”

---

### Multitenancy (`tenant_id`)

**Didática:** Nunca confiar no client para filtrar tenant.

**Resposta:** “tenant_id do JWT + filtro em SQL e vector search; testes negativos cruzados; RLS como opção avançada.”

**Explicação:** Bug de tenant = severidade máxima.

---

### Prompt injection

**Didática:** Usuário tenta fugir da política do sistema — não é XSS clássico.

**Resposta:** “Separar system/user, limitar tools, validar saída; input hostil por padrão.”

**Explicação:** Sem solução perfeita; camadas reduzem risco.

---

### Custos de LLM em produto

**Didática:** Token = dinheiro; streaming melhora UX, não necessariamente custo de geração.

**Resposta:** “Budget por plano, cache, modelo menor para triagem, alertas de custo.”

---

### GraphQL vs REST

**Didática:** REST = pratos fixos; GraphQL = buffet montado pelo cliente.

**Resposta:** “REST + OpenAPI para maioria dos times; GraphQL se muitos clients e agregações muito diferentes — com disciplina de schema.”

---

### Webhooks (Stripe etc.)

**Didática:** Provedor reenvia evento — endpoint deve ser idempotente.

**Resposta:** “Validar assinatura, persistir eventId, 200 rápido, processar async se pesado.”

---

### LGPD / PII em logs e RAG

**Didática:** Log e embedding podem reter PII sem querer.

**Resposta:** “Minimização, mascaramento, retenção; base de conhecimento sem dados sensíveis ou com controle forte.”

---

### Pergunta comportamental (“produção quebrou”)

**Didática:** STAR com causa raiz e prevenção.

**Resposta:** (Prepare um caso: detecção → mitigação → correção → prevenção — fila, DB, limite, prompt.)

---

*Documento gerado para estudo de entrevista técnica. Ajuste cada **Resposta** com exemplos reais dos seus projetos.*
