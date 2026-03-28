# Modelo WMS (simulação) — visão geral

Este documento descreve o desenho de dados usado no **chat-api** para simular um **armazém (WMS) básico mas realista**: onde está o stock, picking, transferências internas e **quem fez o quê**. As tabelas correspondentes estão definidas em **TypeORM** no módulo `wms`, uma pasta por entidade (ex.: `src/modules/wms/warehouse/persistence/warehouse.orm-entity.ts`, `products/` para SKU); com `DB_SYNC=true` o **PostgreSQL** cria/atualiza o esquema automaticamente.

---

## O que este modelo te permite fazer

| Necessidade | Onde isso vive no modelo |
|-------------|---------------------------|
| Estrutura física lógica (armazém → zona → posição) | **Warehouse** → **Zone** → **Location** |
| Cadastro de SKU | **Product** (já existe hoje na API) |
| Rastrear paletes, caixas, totes | **HandlingUnit** (com **tipo**: palete, caixa, etc.) |
| Saber **quanto** há **onde** (e opcionalmente em que unidade) | **InventoryBalance** |
| Processo de saída **por linhas** (apanhar produtos) | **PickOrder** + **PickLine** |
| Movimento interno **documentado** (sem ser venda) | **TransferOrder** + **TransferLine** |
| Saber **quem** criou, liberou, apanhou ou concluiu | **User** + colunas `*_user_id` (e datas onde fizer sentido) nos documentos/linhas |

Não incluímos **StockMovement** nesta fase: dá para saber **quem** fez pick ou transferência pelos documentos; se mais tarde quiseres um histórico “linha a linha” só de movimentação de quantidades, podemos acrescentar.

---

## Convenções gerais

- Identificadores em **UUID** onde for chave primária (alinhado ao que já usas em **Product**).
- Nomes de tabelas e colunas em **inglês** no código e na base (padrão da API).
- Datas com **timestamptz** (hora com fuso, útil para logs).
- Estados (status) em **texto** ou **enum** na aplicação — o significado de **cada** valor está na secção seguinte.

---

## Estados (`status`) — o que cada opção significa

Abaixo: valores **planeados** para a simulação. Na implementação podemos usar `enum` TypeScript + coluna `varchar` na base.

### HandlingUnit — campo `status`

| Valor | Significado |
|--------|-------------|
| **`EMPTY`** | Unidade “vazia” no sentido operacional: **sem carga** associada ou **disponível** para ser carregada de novo (ex.: palete devolvido após despejo). Não deveria ter stock em **InventoryBalance** ligado a esta HU — ou então é estado transitório a limpar nas regras. |
| **`IN_USE`** | Unidade **em uso**: com mercadoria, em trânsito endereçado, ou ativa no armazém. É o estado “normal” quando há stock **nesta** HU. |
| **`BLOCKED`** | **Não mexer**: quarentena, divergência de inventário, avaria, bloqueio de qualidade. O sistema **não** deve sugerir picks nem transferências que usem esta HU até alguém desbloquear. |

---

### PickOrder — campo `status` (cabeçalho do pedido de picking)

| Valor | Significado |
|--------|-------------|
| **`DRAFT`** | Pedido **em montagem**: podes adicionar ou alterar linhas, **ainda não** foi enviado para o chão. Stock pode **não** estar reservado (depende da regra que implementares). |
| **`RELEASED`** | Pedido **liberado** para execução: já pode aparecer para operadores / dispositivos. Normalmente daqui em diante **reserva-se** stock (se usares `quantity_reserved`) e as **PickLine** passam a poder ser trabalhadas. |
| **`PICKING`** | Pick **em curso**: há trabalho ativo (pelo menos uma linha aberta ou parcial, ou política que marca o cabeçalho quando ocorre a primeira confirmação). |
| **`PICKED`** | **Todas** as linhas necessárias foram **concluídas** (ou a quantidade apanhada cumpre o pedido segundo a regra definida). Documento pronto para fechar o fluxo de saída (expedição, etc.). |
| **`CANCELLED`** | Pedido **anulado**. **Não** deve consumir stock: liberta reservas e impede novas confirmações de pick. |

**Fluxo típico:** `DRAFT` → `RELEASED` → `PICKING` → `PICKED`. `CANCELLED` pode surgir a partir de `DRAFT` ou `RELEASED` (e talvez com regras especiais se já houver pick parcial).

---

### PickLine — campo `status` (cada linha do pedido)

| Valor | Significado |
|--------|-------------|
| **`OPEN`** | Linha **por fazer**: `quantity_picked` é zero (ou abaixo do mínimo que consideras “em progresso”). |
| **`PARTIAL`** | **Parte** da quantidade pedida **já foi confirmada** como apanhada (`quantity_picked` > 0 e < `quantity_ordered`, salvo política de tolerância). |
| **`DONE`** | Linha **fechada**: quantidade apanhada **cumpre** o pedido (`quantity_picked` ≥ `quantity_ordered`, ou igual dentro de tolerância). |

Isto é **independente** do estado do cabeçalho: o **PickOrder** só vai a `PICKED` quando **todas** as linhas relevantes estiverem `DONE` (ou canceladas segundo regra).

---

### TransferOrder — campo `status` (cabeçalho da transferência interna)

| Valor | Significado |
|--------|-------------|
| **`DRAFT`** | Documento **a ser montado**: linhas podem mudar; **nenhum** movimento de stock deve estar aplicado ainda (ou só simulação). |
| **`IN_PROGRESS`** | Transferência **a ser executada**: pelo menos uma linha foi **iniciada** ou **concluída**; o stock pode já ter sido alterado parcialmente. |
| **`COMPLETED`** | **Todas** as linhas foram **executadas** e os saldos (**InventoryBalance**) estão alinhados com o documento. |
| **`CANCELLED`** | Documento **anulado**. Se já houvesse movimentos parciais, a implementação tem de decidir: **reverter** movimentos ou bloquear cancelamento após `IN_PROGRESS` — convém fixar uma regra simples na simulação. |

**Fluxo típico:** `DRAFT` → `IN_PROGRESS` → `COMPLETED`.

---

### TransferLine — campo `status` (cada linha da transferência)

Só faz sentido se quiseres **concluir linha a linha**; caso contrário podes inferir tudo pelo cabeçalho.

| Valor | Significado |
|--------|-------------|
| **`OPEN`** | Esta linha **ainda não** foi **executada**: stock **não** foi debitado/creditado nos locais/HU desta linha (ou ainda não deveria estar). |
| **`DONE`** | Movimento **desta linha confirmado**: origem e destino (e **InventoryBalance**) atualizados conforme a quantidade da linha. |

**Fluxo típico:** `OPEN` → `DONE`.

---

## 1. User

**Para que serve:** identificar **pessoas** (ou contas operacionais) que criam documentos, liberam picking, apanham linhas ou concluem transferências. É a peça mínima para “quem fez o quê”.

**Atributos (planeados):**

| Atributo | Porquê |
|----------|--------|
| `id` | Chave única. |
| `code` | Código curto (ex.: matrícula), único — útil em listas e talvez leitores. |
| `display_name` | Nome amigável nos ecrãs e relatórios. |
| `active` | Desativar sem apagar histórico (não “sumir” utilizadores referenciados). |
| `created_at` / `updated_at` | Auditoria simples do cadastro. |

**Nota:** Nesta fase **não** é obrigatório ter password ou JWT; podes simular escolhendo o utilizador na app ou passando um id fixo. Autenticação forte entra depois.

---

## 2. Warehouse

**Para que serve:** representar **um armazém** (ou instalação) quando no futuro puderes ter mais do que um. Mesmo com um só, ajuda a organizar zonas e códigos.

**Atributos:**

| Atributo | Porquê |
|----------|--------|
| `id` | PK. |
| `code` | Código único (ex. `WH01`). |
| `name` | Nome legível. |
| `active` | Armazém fechado / em desuso sem apagar dados. |
| `created_at` / `updated_at` | Cadastro. |

---

## 3. Zone

**Para que serve:** **agrupar locais** com função parecida — por exemplo zona de picking, armazenagem de paletes, receção, expedição.

**Atributos:**

| Atributo | Porquê |
|----------|--------|
| `id` | PK. |
| `warehouse_id` | FK → **Warehouse** (toda a zona pertence a um armazém). |
| `code` | Código único **dentro do armazém** (ex. `PICK-A`). |
| `name` | Descrição. |
| `zone_type` | Tipo lógico: por exemplo `STORAGE`, `PICKING`, `RECEIVING`, `SHIPPING`, `STAGING` (ajustamos à simulação). |
| `created_at` / `updated_at` | Cadastro. |

---

## 4. Location (endereço de armazenagem)

**Para que serve:** a **posição física lógica** onde o stock “morada” — corredor, módulo de estante, nível. **Não** é morada postal de cliente.

**Atributos:**

| Atributo | Porquê |
|----------|--------|
| `id` | PK. |
| `zone_id` | FK → **Zone**. |
| `code` | Código único no contexto que definirmos (muitas vezes único por armazém), ex. `A-01-03-02`. |
| `aisle` | Corredor / “rua” (opcional se `code` já for composto). |
| `bay` | Módulo / bloco (opcional). |
| `level` | Nível vertical (opcional). |
| `active` | Local bloqueado ou fora de uso. |
| `created_at` / `updated_at` | Cadastro. |

---

## 5. Product

**Para que serve:** o **SKU** — já existe na API (nome, código de barras, descrição, etc.). No WMS é referenciado por saldos, linhas de pick e linhas de transferência.

**Nota:** Os campos atuais de **Product** mantêm-se; não repetimos aqui todos — apenas encaixamos no modelo WMS.

---

## 6. HandlingUnit

**Para que serve:** **unidade logística identificável** — palete, caixa, tote — com código próprio (tipo LPN). Permite dizer “este stock está **neste** palete **neste** local”.

**Atributos:**

| Atributo | Porquê |
|----------|--------|
| `id` | PK. |
| `code` | Identificador único (etiqueta interna, SSCC, etc.). |
| `type` | `PALLET`, `CASE`, `TOTE`, … — **uma tabela**, vários tipos. |
| `current_location_id` | FK → **Location** (onde está agora); pode ser nulo se ainda não endereçado. |
| `status` | Valores: `EMPTY`, `IN_USE`, `BLOCKED`. Ver **Estados (`status`) → HandlingUnit**. |
| `created_at` / `updated_at` | Cadastro / última alteração. |

---

## 7. InventoryBalance

**Para que serve:** resposta direta a **“quanto tenho deste produto neste sítio (e opcionalmente nesta HU)?”**. É o **estado atual** do stock por combinação; picks e transferências **alteram** estas quantidades quando confirmados.

**Atributos:**

| Atributo | Porquê |
|----------|--------|
| `id` | PK. |
| `product_id` | FK → **Product**. |
| `location_id` | FK → **Location**. |
| `handling_unit_id` | FK → **HandlingUnit**, **nullable** — se não usares HU num fluxo, o stock fica “só por local”. |
| `quantity_on_hand` | Quantidade fisicamente (ou logicamente) disponível naquela combinação. |
| `quantity_reserved` | Quantidade já alocada a picks (opcional mas útil para não vender o mesmo stock duas vezes); pode começar a 0. |
| `updated_at` | Última alteração de saldo. |

**Regra de unicidade:** uma linha por combinação relevante `(product_id, location_id, handling_unit_id)` — com `handling_unit_id` nulo tratado de forma consistente (na implementação definimos o índice único em PostgreSQL).

---

## 8. PickOrder

**Para que serve:** **cabeçalho** de um pedido de picking (saída por linhas): um documento com número, estado, prioridade, e **quem** interveio nas fases principais.

**Atributos:**

| Atributo | Porquê |
|----------|--------|
| `id` | PK. |
| `order_number` | Número legível, único (ex. para impressão / pesquisa). |
| `warehouse_id` | FK → **Warehouse** (onde o picking corre). |
| `status` | Valores: `DRAFT`, `RELEASED`, `PICKING`, `PICKED`, `CANCELLED`. Ver **Estados (`status`) → PickOrder**. |
| `priority` | Ordem relativa entre pedidos (opcional). |
| `created_by_user_id` | FK → **User** — quem criou. |
| `released_by_user_id` | FK → **User**, nullable — quem liberou para o chão. |
| `released_at` | Quando foi liberado. |
| `completed_by_user_id` | FK → **User**, nullable — quem fechou o pedido. |
| `completed_at` | Quando foi concluído. |
| `created_at` / `updated_at` | Auditoria do documento. |

---

## 9. PickLine

**Para que serve:** **cada linha** do pedido: qual **produto**, **quantidade pedida** vs **apanhada**, local sugerido, e sobretudo **quem apanhou** e **quando**.

**Atributos:**

| Atributo | Porquê |
|----------|--------|
| `id` | PK. |
| `pick_order_id` | FK → **PickOrder**. |
| `product_id` | FK → **Product**. |
| `quantity_ordered` | O que foi pedido. |
| `quantity_picked` | O que já foi confirmado (0 no início). |
| `source_location_id` | FK → **Location**, nullable — sugestão de onde apanhar. |
| `status` | Valores: `OPEN`, `PARTIAL`, `DONE`. Ver **Estados (`status`) → PickLine**. |
| `picked_by_user_id` | FK → **User**, nullable até confirmar pick da linha. |
| `picked_at` | Momento da confirmação do pick desta linha. |
| `created_at` / `updated_at` | Auditoria. |

---

## 10. TransferOrder

**Para que serve:** **documento** de **movimento interno** (não é venda): autoriza mover stock entre locais (e opcionalmente entre HU). Inclui **quem** criou e **quem** concluiu.

**Atributos:**

| Atributo | Porquê |
|----------|--------|
| `id` | PK. |
| `reference_code` | Código único do documento (ex. `TRF-2026-0001`). |
| `warehouse_id` | FK → **Warehouse**, opcional se tudo for inferido pelas linhas. |
| `status` | Valores: `DRAFT`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`. Ver **Estados (`status`) → TransferOrder**. |
| `created_by_user_id` | FK → **User**. |
| `completed_by_user_id` | FK → **User**, nullable até concluir. |
| `completed_at` | Quando a transferência foi fechada. |
| `created_at` / `updated_at` | Auditoria. |

**Nota:** O **“o quê”** e **“de onde para onde”** estão nas **TransferLine**. O cabeçalho traz o **“quem”** ao nível do documento (suficiente para muitas simulações). Se mais tarde precisares de “quem confirmou **cada** linha”, podemos acrescentar `executed_by_user_id` em **TransferLine**.

---

## 11. TransferLine

**Para que serve:** **cada movimento concreto** dentro da transferência: produto, quantidade, **local de origem** e **local de destino**, e opcionalmente HU de origem/destino.

**Atributos:**

| Atributo | Porquê |
|----------|--------|
| `id` | PK. |
| `transfer_order_id` | FK → **TransferOrder**. |
| `product_id` | FK → **Product**. |
| `quantity` | Quantidade a mover. |
| `from_location_id` | FK → **Location**. |
| `to_location_id` | FK → **Location**. |
| `from_handling_unit_id` | FK → **HandlingUnit**, nullable. |
| `to_handling_unit_id` | FK → **HandlingUnit**, nullable. |
| `status` | Opcional. Valores: `OPEN`, `DONE`. Ver **Estados (`status`) → TransferLine**. |
| `created_at` / `updated_at` | Auditoria. |

---

## Relações em uma frase

- **Warehouse** tem muitas **Zones**; cada **Zone** tem muitas **Locations**.  
- **Product** aparece em **InventoryBalance**, **PickLine** e **TransferLine**.  
- **HandlingUnit** tem posição atual (**Location**) e entra opcionalmente no **InventoryBalance** e nas linhas de transferência.  
- **PickOrder** tem muitas **PickLines**; **TransferOrder** tem muitas **TransferLines**.  
- **User** é referenciado nos documentos e na **PickLine** para “quem apanhou”.

---

## Próximo passo

**Feito:** entidades TypeORM, relações e `synchronize` (via `DB_SYNC`). **Utilizador WMS:** tabela `wms_users` (evita colisão com futuras tabelas de autenticação).

**A seguir (opcional):** serviços e endpoints REST que ao **confirmar** pick/transferência atualizem **InventoryBalance** e preencham os `*_user_id` conforme o utilizador da simulação; migrações explícitas em produção em vez de `synchronize`.

Se quiseres ajustar nomes de `status`, `zone_type` ou campos opcionais antes de codar, é a altura ideal.
