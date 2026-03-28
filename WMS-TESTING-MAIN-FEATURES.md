# WMS — guia de testes das funcionalidades principais (chat-api)

Este documento descreve **como testar** os endpoints relevantes ao WMS, **o que esperar como resposta** e, quando aplicável, **como ficam os dados na base antes e depois**.  
Prefixo global da API: **`/api`** (ex.: `http://localhost:3001/api`).  
Swagger: **`/api/docs`**.

**Documentos relacionados:** `PROJECT-RULES.md`, `WMS-MODEL.md`, `WMS-FUNCIONALIDADES-TODO.md`.

---

## 1. Preparação

| Passo | Descrição |
|-------|-----------|
| Subir a API | `yarn start:dev` (porta padrão **3001**, ou `PORT` no `.env`). |
| Base previsível | `yarn seed` repõe dados de demonstração (PostgreSQL). |
| Conferir saúde | `GET /api/health` (ver secção Health). |

---

## 2. UUIDs e dados do seed (`yarn seed`)

Os valores **fixos** abaixo vêm de `src/database/database-seed.service.ts` e podem ser copiados para testes. **Zonas, locais, unidades de manuseio e cabeçalhos de ordens** passam a ter **UUID gerado** em cada execução do seed — para esses casos use **listagens** (`GET`) ou identificadores de negócio estáveis (`orderNumber`, `referenceCode`, `code` do local, `barcode` do produto).

**Ordens de demonstração:** existem várias réplicas por template (sufixo `-R1`, `-R2`, … no número/referência). As ordens **sem sufixo** (`PO-SEED-LIBERADO`, `TRF-SEED-RASCUNHO`, …) correspondem ao primeiro lote e são úteis em `by-order-number` / `by-reference`.

**Volume aproximado do seed atual:** ~200 utilizadores WMS, **12 zonas**, **400 locais**, 4 armazéns; produtos e documentos operacionais seguem o multiplicador definido no serviço de seed.

### 2.1 UUIDs estáveis (fixos no seed)

| Chave | UUID |
|-------|------|
| Utilizador Alice | `a1000000-0000-4000-8000-000000000001` |
| Utilizador Bob | `a1000000-0000-4000-8000-000000000002` |
| Armazém WH01 (principal) | `b1000000-0000-4000-8000-000000000001` |
| Armazém Sul | `b1000000-0000-4000-8000-000000000002` |
| Produto SKU A | `e1000000-0000-4000-8000-000000000001` (barcode: `SEED-SKU-A`) |
| Produtos SKU B–H (base) | `e1000000-0000-4000-8000-000000000002` … `…000008` (barcodes `SEED-SKU-B` … `SEED-SKU-H`) |

### 2.2 UUID variável — como obter

| Recurso | Como identificar |
|---------|------------------|
| **Local** (ex.: bulk A `A-01-01`, receção `RCV-D1`) | `GET /api/locations` (opcional `?zoneId=`) e localizar pelo campo **`code`** na resposta. |
| **HU** (ex.: `SSCC-SEED-PALLET-01`) | `GET /api/handling-units` e filtrar pelo **`code`** no cliente ou no Swagger. |
| **Pick order** | `GET /api/pick-orders/by-order-number?orderNumber=PO-SEED-LIBERADO` — usar o **`id`** do cabeçalho para `GET /api/pick-orders/:id/detail`. |
| **Transfer order** | `GET /api/transfer-orders/by-reference?referenceCode=TRF-SEED-RASCUNHO` — usar o **`id`** do cabeçalho para `GET /api/transfer-orders/:id/detail`. |

---

## 3. Health

| Método | Caminho | Para que serve |
|--------|---------|----------------|
| **GET** | `/api/health` | Verificar se a API responde (`status`, `service`, `timestamp`). |

**Como testar:** navegador ou cliente HTTP em `GET http://localhost:3001/api/health`.

**Antes / depois:** não altera base de dados.

**Resultado esperado:** JSON com `status: "ok"`, `service: "chat-api"`, `timestamp` ISO.

---

## 4. Produtos

| Método | Caminho | Descrição |
|--------|---------|-----------|
| **GET** | `/api/products` | Lista todos os produtos. |
| **GET** | `/api/products?q=` | Pesquisa por **nome ou descrição** (ILIKE; caracteres de wildcard no texto são neutralizados no backend). |
| **GET** | `/api/products/by-barcode?barcode=` | Produto pelo **código de barras exato**. |
| **GET** | `/api/products/:id` | Um produto por UUID. |
| **POST** | `/api/products` | Criar produto. |
| **PUT** | `/api/products/:id` | Atualizar. |
| **DELETE** | `/api/products/:id` | Apagar (pode falhar se houver FKs). |

**Exemplos:**

- `GET /api/products?q=parafuso` — devolve produtos cujo nome ou descrição contém o termo.
- `GET /api/products/by-barcode?barcode=SEED-SKU-A` — devolve o SKU A do seed.

**Antes / depois:** os **GET** não alteram a BD. **POST/PUT/DELETE** alteram a tabela `products`.

**Erro comum:** barcode inexistente em `by-barcode` → **404**.

---

## 5. Utilizadores WMS, armazéns, zonas, locais, unidades de manuseio

Padrão CRUD em:

- `/api/wms-users`
- `/api/warehouses`
- `/api/zones` (query opcional `warehouseId`)
- `/api/locations` (query opcional `zoneId`)
- `/api/handling-units`

**Como testar:** `GET` listagem e `GET :id` para validar leitura; `POST`/`PUT`/`DELETE` conforme DTOs no Swagger.

**Antes / depois:** leituras não mudam dados; escritas alteram as respetivas tabelas.

---

## 6. Saldos de inventário (`inventory-balances`)

| Método | Caminho | Descrição |
|--------|---------|-----------|
| **GET** | `/api/inventory-balances` | Lista saldos; queries opcionais `productId`, `locationId`. |
| **GET** | `/api/inventory-balances/summary-by-product?productId=` | **Resumo** do SKU: totais e **detalhe por local/HU** com `quantityAvailable` por linha. |
| **GET** | `/api/inventory-balances/:id` | Uma linha de saldo por id. |
| **POST** | `/api/inventory-balances` | Criar linha de saldo. |
| **PUT** | `/api/inventory-balances/:id` | Atualizar saldo manualmente (testes). |
| **DELETE** | `/api/inventory-balances/:id` | Remover linha de saldo. |

**Campos importantes na resposta:**

- `quantityOnHand` — físico / em livros na combinação produto+local+HU.
- `quantityReserved` — quantidade já reservada a picks/transferências.
- **`quantityAvailable`** — `quantityOnHand - quantityReserved` (disponível para nova reserva).

**Como testar leitura:**

1. `GET /api/inventory-balances?productId=e1000000-0000-4000-8000-000000000001`
2. `GET /api/inventory-balances/summary-by-product?productId=e1000000-0000-4000-8000-000000000001`

**Antes / depois:** **GET** não altera dados. **PUT** manual muda `quantity_on_hand` / `quantity_reserved` diretamente na linha.

---

## 7. Ordens de picking (`pick-orders`) e linhas (`pick-lines`)

### 7.1 Leitura e pesquisa

| Método | Caminho | Descrição |
|--------|---------|-----------|
| **GET** | `/api/pick-orders` | Lista; filtros opcionais: `warehouseId`, `status`, `orderNumber` (parcial ILIKE), `completedByUserId` (quem fechou ordens **PICKED**). |
| **GET** | `/api/pick-orders/by-order-number?orderNumber=` | Cabeçalho + **linhas** pelo **número exato** da ordem (ex.: `PO-SEED-LIBERADO`). |
| **GET** | `/api/pick-orders/:id/detail` | Cabeçalho + linhas por **UUID** da ordem. |
| **GET** | `/api/pick-orders/:id` | Só cabeçalho. |
| **GET** | `/api/pick-lines` | Lista linhas; query opcional `pickOrderId`. |
| **GET** | `/api/pick-lines/:id` | Uma linha. |

**Exemplos:**

- `GET /api/pick-orders?warehouseId=b1000000-0000-4000-8000-000000000001&status=RELEASED`
- `GET /api/pick-orders?completedByUserId=a1000000-0000-4000-8000-000000000002`
- `GET /api/pick-orders/by-order-number?orderNumber=PO-SEED-LIBERADO`
- `GET /api/pick-orders/{id}/detail` — o `id` copie-o da resposta de `by-order-number` ou da listagem (UUID já não é fixo entre execuções do seed).

**Antes / depois:** apenas **GET** → sem alteração de BD.

### 7.2 Escrita (fluxo operacional)

| Método | Caminho | Descrição |
|--------|---------|-----------|
| **POST** | `/api/pick-orders` | Criar cabeçalho (tipicamente **DRAFT**). |
| **POST** | `/api/pick-orders/:id/release` | **Liberar** ordem: estado → **RELEASED**; **reserva** `quantity_ordered` por linha no saldo de origem. Body: `releasedByUserId`. |
| **POST** | `/api/pick-orders/:id/cancel` | **Cancelar**; liberta reservas pendentes quando aplicável. |
| **POST** | `/api/pick-lines` | Criar linha (produto, quantidade pedida, `sourceLocationId`, opcional `sourceHandlingUnitId`). |
| **POST** | `/api/pick-lines/:id/confirm-pick` | Confirmar separação: body `quantityDelta`, `pickedByUserId`. Baixa stock e liberta reserva proporcional. |

**Efeitos na BD (resumo):**

| Ação | Efeito principal |
|------|------------------|
| **release** | `pick_orders.status` → RELEASED; `quantity_reserved` **aumenta** nas linhas de `inventory_balances` de origem (por linha, até ao pedido). |
| **confirm-pick** | `quantity_on_hand` **diminui**; `quantity_reserved` **diminui**; `pick_lines.quantity_picked` aumenta; pode passar a **PICKING** / **PICKED** no cabeçalho. |
| **cancel** | Liberta reservas remanescentes; estado → **CANCELLED** (não permite se já **PICKED**). |

**“Concluir” picking:** não existe endpoint só de “fechar cabeçalho”. O cabeçalho vai a **PICKED** quando **todas** as linhas estão em estado concluído após confirmações de pick.

**Corpo JSON (exemplo) — confirmar pick**

```json
{
  "quantityDelta": 5,
  "pickedByUserId": "a1000000-0000-4000-8000-000000000002"
}
```

`quantityDelta` é o **incremento** confirmado nesta chamada (não o total acumulado).

**Teste sugerido após seed:**

1. Ver saldo antes: `GET /api/inventory-balances/summary-by-product?productId=...` para o produto da linha.
2. Criar ordem em DRAFT + linha com origem e quantidades compatíveis (ou usar ordem rascunho `PO-SEED-RASCUNHO` se as linhas estiverem corretas).
3. `POST .../release` com `releasedByUserId` = Alice.
4. Comparar saldos **antes/depois** (reserva aumentada).
5. `POST .../confirm-pick` numa linha com `quantityDelta` parcial ou total.
6. Verificar `quantity_on_hand`, `quantity_reserved`, `quantity_picked`.

---

## 8. Ordens de transferência (`transfer-orders`) e linhas (`transfer-lines`)

### 8.1 Leitura e pesquisa

| Método | Caminho | Descrição |
|--------|---------|-----------|
| **GET** | `/api/transfer-orders` | Lista; filtros: `warehouseId`, `status`, `referenceCode` (parcial), `completedByUserId`. |
| **GET** | `/api/transfer-orders/by-reference?referenceCode=` | Cabeçalho + linhas pelo **código exato** (ex.: `TRF-SEED-RASCUNHO`). |
| **GET** | `/api/transfer-orders/:id/detail` | Cabeçalho + linhas por UUID. |
| **GET** | `/api/transfer-orders/:id` | Só cabeçalho. |
| **GET** | `/api/transfer-lines` | Lista; `transferOrderId` opcional. |
| **GET** | `/api/transfer-lines/:id` | Uma linha. |

**Antes / depois:** **GET** não altera BD.

### 8.2 Escrita

| Método | Caminho | Descrição |
|--------|---------|-----------|
| **POST** | `/api/transfer-orders` | Criar cabeçalho (**DRAFT**). |
| **POST** | `/api/transfer-orders/:id/release` | **Liberar**: estado → **RELEASED**; **reserva** na origem por linha em aberto. Body: `releasedByUserId`. |
| **POST** | `/api/transfer-orders/:id/cancel` | Cancelar (regras: não cancela **IN_PROGRESS** com linhas já executadas, nem **COMPLETED**). |
| **POST** | `/api/transfer-lines` | Criar linha (origem, destino, quantidade, HUs opcionais). |
| **POST** | `/api/transfer-lines/:id/confirm` | Executar linha: movimento origem → destino; HU destino atualizada se aplicável. Body: `executedByUserId`. |

**Efeitos na BD (resumo):**

| Ação | Efeito principal |
|------|------------------|
| **release** | `quantity_reserved` **aumenta** na origem por linha. |
| **confirm** | Origem: `quantity_on_hand` e reserva baixam; destino: `quantity_on_hand` sobe; linha → **DONE**; cabeçalho pode ir a **IN_PROGRESS** / **COMPLETED**. |
| **cancel** (DRAFT/RELEASED) | Liberta reservas das linhas em aberto. |

**“Concluir” transferência:** quando **todas** as linhas estão **DONE**, o cabeçalho fica **COMPLETED** (sem endpoint extra só para “concluir”).

**Corpo JSON (exemplo) — confirmar linha de transferência**

```json
{
  "executedByUserId": "a1000000-0000-4000-8000-000000000002"
}
```

---

## 9. Ajustes de inventário (`inventory-adjustments`)

| Método | Caminho | Descrição |
|--------|---------|-----------|
| **GET** | `/api/inventory-adjustments` | Lista registos de ajuste. |
| **GET** | `/api/inventory-adjustments/:id` | Um ajuste. |
| **POST** | `/api/inventory-adjustments` | Regista motivo + utilizador e aplica **delta** no saldo (positivo ou negativo). |

**Exemplo (quebra/perda):** `quantityDelta` negativo, `reason` descritivo, `createdByUserId`.

**Antes:** saldo com `quantity_on_hand = N`.  
**Depois:** `N + delta` (respeitando regras de não negativar indevidamente); nova linha em `inventory_adjustments`.

---

## 10. Recebimento simples (`goods-receipts`)

| Método | Caminho | Descrição |
|--------|---------|-----------|
| **GET** | `/api/goods-receipts` | Lista; `warehouseId` opcional. |
| **GET** | `/api/goods-receipts/:id` | Cabeçalho. |
| **GET** | `/api/goods-receipts/:id/lines` | Linhas. |
| **POST** | `/api/goods-receipts` | Criar recebimento **DRAFT**. |
| **POST** | `/api/goods-receipts/:id/lines` | Adicionar linha (produto, quantidade). |
| **POST** | `/api/goods-receipts/:id/post` | **Lançar**: entrada no `receiving_location_id` (sem HU agregado). Body: `postedByUserId`. |

**Antes:** sem entrada refletida no local de receção para essa linha.  
**Depois:** `quantity_on_hand` aumenta (ou cria linha) em `inventory_balances` nesse local; cabeçalho **POSTED**.

---

## 11. Putaway (`putaway`)

| Método | Caminho | Descrição |
|--------|---------|-----------|
| **POST** | `/api/putaway/suggest` | Body: `productId`, `warehouseId` (quantidade opcional). Devolve **sugestão** de local (heurística zona STORAGE). |

**Antes / depois:** **não persiste** dados — só leitura/cálculo.

---

## 12. Contagem cíclica (`cycle-count-tasks`)

| Método | Caminho | Descrição |
|--------|---------|-----------|
| **GET** | `/api/cycle-count-tasks` | Lista; `warehouseId` opcional. |
| **GET** | `/api/cycle-count-tasks/:id` | Tarefa. |
| **GET** | `/api/cycle-count-tasks/:id/lines` | Linhas. |
| **POST** | `/api/cycle-count-tasks` | Criar tarefa. |
| **POST** | `/api/cycle-count-tasks/:id/lines` | Adicionar linha (snapshot `quantity_expected`). |
| **POST** | `/api/cycle-count-tasks/:id/submit-counts` | Registar contagens físicas. |
| **POST** | `/api/cycle-count-tasks/:id/post-adjustments` | Gerar ajustes pelas diferenças e concluir tarefa. |

**Antes / depois (post-adjustments):** saldos alinhados à contagem; registos em `inventory_adjustments` com motivo ligado à tarefa.

---

## 13. Ondas de picking (`pick-waves`)

| Método | Caminho | Descrição |
|--------|---------|-----------|
| **GET** | `/api/pick-waves` | Lista; `warehouseId` opcional. |
| **GET** | `/api/pick-waves/:id` | Onda. |
| **GET** | `/api/pick-waves/:id/orders` | Ordens associadas e `sortOrder`. |
| **POST** | `/api/pick-waves` | Criar onda **DRAFT**. |
| **POST** | `/api/pick-waves/:id/orders` | Associar ordem de picking à onda. |
| **POST** | `/api/pick-waves/:id/release` | Liberar onda e **repriorizar** ordens associadas (`priority` em `pick_orders`). |

**Antes:** prioridades antigas nas ordens da onda.  
**Depois:** `priority` recalculado conforme a lógica do serviço; onda **RELEASED**.

---

## 14. Integrações (`integrations`)

| Método | Caminho | Descrição |
|--------|---------|-----------|
| **GET** | `/api/integrations/status` | Stub de estado (ERP, transporte, etiquetas, leitores, webhooks). |

**Antes / depois:** não usa base de dados.

---

## 15. Checklist rápido por objetivo

| Objetivo | Onde testar |
|----------|-------------|
| Produto por barcode | `GET /api/products/by-barcode?barcode=` |
| Pesquisa nome/descrição | `GET /api/products?q=` |
| Disponível total + por local | `GET /api/inventory-balances/summary-by-product?productId=` e/ou `GET /api/inventory-balances?productId=` |
| Quebra/perda | `POST /api/inventory-adjustments` (delta negativo) |
| Listar / filtrar pickings | `GET /api/pick-orders` + filtros |
| Picking por código com linhas | `GET /api/pick-orders/by-order-number` ou `.../:id/detail` |
| Iniciar picking (reserva) | `POST /api/pick-orders/:id/release` |
| Cancelar picking | `POST /api/pick-orders/:id/cancel` |
| Confirmar separação | `POST /api/pick-lines/:id/confirm-pick` |
| Listar / filtrar transferências | `GET /api/transfer-orders` + filtros |
| Transferência por código com linhas | `GET /api/transfer-orders/by-reference` ou `.../:id/detail` |
| Iniciar transferência (reserva) | `POST /api/transfer-orders/:id/release` |
| Cancelar transferência | `POST /api/transfer-orders/:id/cancel` |
| Executar linha de transferência | `POST /api/transfer-lines/:id/confirm` |
| Utilizador WMS | `GET /api/wms-users`, `GET /api/wms-users/:id` |
| Pickings concluídos **por utilizador** | `GET /api/pick-orders?completedByUserId=` (utilizador em `completed_by` quando **PICKED**) |
| Transferências concluídas **por utilizador** | `GET /api/transfer-orders?completedByUserId=` |
| Zonas | `GET /api/zones`, `GET /api/zones/:id` |

---

## 16. Validação do projeto

Após alterações de código, o projeto espera:

- `yarn build`
- `yarn lint`
- (opcional) `yarn test`

---

## 17. Índice de rotas WMS por recurso (referência)

| Recurso | Prefixo |
|---------|---------|
| Produtos | `/api/products` |
| Utilizadores WMS | `/api/wms-users` |
| Armazéns | `/api/warehouses` |
| Zonas | `/api/zones` |
| Localizações | `/api/locations` |
| Unidades de manuseio | `/api/handling-units` |
| Saldos | `/api/inventory-balances` |
| Ajustes de inventário | `/api/inventory-adjustments` |
| Recebimentos | `/api/goods-receipts` |
| Putaway | `/api/putaway` |
| Contagem cíclica | `/api/cycle-count-tasks` |
| Ondas de picking | `/api/pick-waves` |
| Ordens de picking | `/api/pick-orders` |
| Linhas de picking | `/api/pick-lines` |
| Ordens de transferência | `/api/transfer-orders` |
| Linhas de transferência | `/api/transfer-lines` |
| Integrações (stub) | `/api/integrations` |
| Health | `/api/health` |

---

*Documento para apoiar testes manuais e integração com o módulo WMS do chat-api.*

