# Índice e mapeamento de endpoints

Todas as rotas HTTP desta API usam o prefixo `**/api**`. Por exemplo, listar armazéns é `GET /api/warehouses`. A documentação interativa (Swagger) fica em `/api/docs` quando o servidor está em execução.

Este arquivo resume **o que existe** e aponta para os guias operacionais em linguagem humana (pasta `docs/`).

## Saúde do serviço


| Método | Caminho       | Função resumida                         |
| ------ | ------------- | --------------------------------------- |
| GET    | `/api/health` | Verificar se o serviço está respondendo |


## Chat (desenvolvimento)


| Método | Caminho               | Função resumida                                                                             |
| ------ | --------------------- | ------------------------------------------------------------------------------------------- |
| POST   | `/api/chat/dev-token` | Emitir token de teste para o chat (só se estiver ativado no ambiente; não usar em produção) |


## Cadastro e estrutura física


| Método           | Caminho                   | Função resumida                                         |
| ---------------- | ------------------------- | ------------------------------------------------------- |
| GET, POST        | `/api/warehouses`         | Listar / criar armazéns                                 |
| GET, PUT, DELETE | `/api/warehouses/:id`     | Ver, atualizar ou remover armazém                       |
| GET, POST        | `/api/zones`              | Listar zonas (filtro opcional por armazém) / criar zona |
| GET, PUT, DELETE | `/api/zones/:id`          | Ver, atualizar ou remover zona                          |
| GET, POST        | `/api/locations`          | Listar localizações (filtro opcional por zona) / criar  |
| GET, PUT, DELETE | `/api/locations/:id`      | Ver, atualizar ou remover localização                   |
| GET, POST        | `/api/handling-units`     | Listar / criar unidades de manuseio                     |
| GET, PUT, DELETE | `/api/handling-units/:id` | Ver, atualizar ou remover unidade de manuseio           |


## Produtos


| Método           | Caminho                             | Função resumida                             |
| ---------------- | ----------------------------------- | ------------------------------------------- |
| GET              | `/api/products/by-barcode?barcode=` | Obter produto pelo código de barras (exato) |
| GET              | `/api/products?q=`                  | Listar produtos (busca opcional por texto)  |
| GET, PUT, DELETE | `/api/products/:id`                 | Ver, atualizar ou apagar produto            |
| POST             | `/api/products`                     | Criar produto                               |


## Inventário (saldos e ajustes)


| Método                 | Caminho                                                 | Função resumida                                                   |
| ---------------------- | ------------------------------------------------------- | ----------------------------------------------------------------- |
| GET                    | `/api/inventory-balances/summary-by-product?productId=` | Resumo de stock de um produto (totais e detalhe por local/HU)     |
| GET                    | `/api/inventory-balances`                               | Listar saldos (filtros opcionais por produto e local)             |
| GET, POST, PUT, DELETE | `/api/inventory-balances/:id`                           | Ver, criar, atualizar ou remover saldo (conforme método)          |
| GET                    | `/api/inventory-adjustments`                            | Listar ajustes registrados                                        |
| GET                    | `/api/inventory-adjustments/:id`                        | Ver um ajuste                                                     |
| POST                   | `/api/inventory-adjustments`                            | Registrar novo ajuste (altera saldo e fica registrado com motivo) |


## Recebimento e endereçamento


| Método | Caminho                         | Função resumida                                          |
| ------ | ------------------------------- | -------------------------------------------------------- |
| GET    | `/api/goods-receipts`           | Listar recebimentos (filtro opcional por armazém)        |
| GET    | `/api/goods-receipts/:id`       | Ver cabeçalho do recebimento                             |
| GET    | `/api/goods-receipts/:id/lines` | Listar linhas do recebimento                             |
| POST   | `/api/goods-receipts`           | Criar recebimento em rascunho                            |
| POST   | `/api/goods-receipts/:id/lines` | Adicionar linha (produto e quantidade)                   |
| POST   | `/api/goods-receipts/:id/post`  | Lançar recebimento (entrada física no local de recepção) |
| POST   | `/api/putaway/suggest`          | Pedir sugestão de local de armazenagem para um produto   |


## Picking (ordens, linhas e ondas)


| Método | Caminho                                         | Função resumida                                                                                  |
| ------ | ----------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| GET    | `/api/pick-orders/by-order-number?orderNumber=` | Obter ordem pelo número, com linhas                                                              |
| GET    | `/api/pick-orders`                              | Listar ordens (filtros: armazém, estado, número parcial, quem concluiu)                          |
| GET    | `/api/pick-orders/:id/detail`                   | Ordem com todas as linhas                                                                        |
| GET    | `/api/pick-orders/:id`                          | Cabeçalho da ordem                                                                               |
| POST   | `/api/pick-orders`                              | Criar ordem de picking                                                                           |
| POST   | `/api/pick-orders/:id/release`                  | Liberar ordem (reserva stock na origem)                                                          |
| POST   | `/api/pick-orders/:id/cancel`                   | Cancelar ordem (devolve reservas conforme regras)                                                |
| GET    | `/api/pick-lines`                               | Listar linhas (filtro opcional por ordem)                                                        |
| GET    | `/api/pick-lines/:id`                           | Ver uma linha                                                                                    |
| POST   | `/api/pick-lines`                               | Criar linha de picking                                                                           |
| POST   | `/api/pick-lines/:id/confirm-pick`              | Confirmar quantidade retirada (baixa física e libera reserva em proporção)                       |
| GET    | `/api/pick-waves`                               | Listar ondas (filtro opcional por armazém)                                                       |
| GET    | `/api/pick-waves/:id/orders`                    | Ordens associadas à onda (por ordem de execução)                                                 |
| GET    | `/api/pick-waves/:id`                           | Ver onda                                                                                         |
| POST   | `/api/pick-waves`                               | Criar onda                                                                                       |
| POST   | `/api/pick-waves/:id/orders`                    | Associar ordem de picking à onda                                                                 |
| POST   | `/api/pick-waves/:id/release`                   | Liberar onda (define prioridades das ordens; não substitui a liberação individual de cada ordem) |


## Transferências internas


| Método | Caminho                                            | Função resumida                                           |
| ------ | -------------------------------------------------- | --------------------------------------------------------- |
| GET    | `/api/transfer-orders/by-reference?referenceCode=` | Obter transferência pelo código de referência, com linhas |
| GET    | `/api/transfer-orders`                             | Listar (filtros semelhantes aos da ordem de picking)      |
| GET    | `/api/transfer-orders/:id/detail`                  | Transferência com linhas                                  |
| GET    | `/api/transfer-orders/:id`                         | Cabeçalho                                                 |
| POST   | `/api/transfer-orders`                             | Criar transferência                                       |
| POST   | `/api/transfer-orders/:id/release`                 | Liberar (reserva na origem)                               |
| POST   | `/api/transfer-orders/:id/cancel`                  | Cancelar (com limitações se já houver execução)           |
| GET    | `/api/transfer-lines`                              | Listar linhas (filtro opcional por ordem)                 |
| GET    | `/api/transfer-lines/:id`                          | Ver linha                                                 |
| POST   | `/api/transfer-lines`                              | Criar linha                                               |
| POST   | `/api/transfer-lines/:id/confirm`                  | Confirmar execução (movimenta origem → destino)           |


## Contagem cíclica


| Método | Caminho                                       | Função resumida                                                              |
| ------ | --------------------------------------------- | ---------------------------------------------------------------------------- |
| GET    | `/api/cycle-count-tasks`                      | Listar tarefas (filtro opcional por armazém)                                 |
| GET    | `/api/cycle-count-tasks/:id`                  | Ver tarefa                                                                   |
| GET    | `/api/cycle-count-tasks/:id/lines`            | Listar linhas                                                                |
| POST   | `/api/cycle-count-tasks`                      | Criar tarefa                                                                 |
| POST   | `/api/cycle-count-tasks/:id/lines`            | Adicionar linha (fixa quantidade “esperada” com base no saldo nesse momento) |
| POST   | `/api/cycle-count-tasks/:id/submit-counts`    | Registrar contagens físicas                                                  |
| POST   | `/api/cycle-count-tasks/:id/post-adjustments` | Gerar ajustes pelas diferenças e concluir tarefa                             |


## Integrações e usuários WMS


| Método           | Caminho                    | Função resumida                                                                      |
| ---------------- | -------------------------- | ------------------------------------------------------------------------------------ |
| GET              | `/api/integrations/status` | Estado resumido das integrações externas (neste projeto é informativo / placeholder) |
| GET, POST        | `/api/wms-users`           | Listar / criar usuários WMS                                                          |
| GET, PUT, DELETE | `/api/wms-users/:id`       | Ver, atualizar ou remover usuário                                                    |


## Documentação operacional por tema


| Documento                                                             | Público típico                                      |
| --------------------------------------------------------------------- | --------------------------------------------------- |
| [Da chegada à saída do armazém](./da-chegada-a-saida-do-armazem.md)     | Visão ponta a ponta — recepção até expedição no WMS |
| [Armazém, zonas e localizações](./armazem-zonas-e-localizacoes.md)    | Quem monta ou mantém a estrutura do armazém         |
| [Produtos](./produtos.md)                                             | Cadastro e consulta de artigos                      |
| [Unidades de manuseio](./unidades-de-manuseio.md)                     | Operações com paletes, caixas, contentores          |
| [Saldos e stock disponível](./saldos-e-stock-disponivel.md)           | Entender “em mão”, reservado e disponível           |
| [Ajustes de inventário](./ajustes-de-inventario.md)                   | Correções pontuais com registro e motivo            |
| [Recebimento de mercadorias](./recebimento-de-mercadorias.md)         | Docas / recepção                                    |
| [Endereçamento (putaway)](./enderecamento-putaway.md)                 | Onde guardar mercadoria recebida                    |
| [Ordem de picking](./ordem-de-picking.md)                             | Planejamento e estados da ordem                     |
| [Linha de picking e confirmação](./linha-de-picking-e-confirmacao.md) | **Separadores** — como confirmar o que foi retirado |
| [Ondas de picking](./ondas-de-picking.md)                             | Agrupar e ordenar ordens por prioridade             |
| [Transferências internas](./transferencias-internas.md)               | Movimentar stock entre locais                       |
| [Contagem cíclica](./contagem-ciclica.md)                             | Inventário rotativo por tarefa                      |
| [Integrações externas](./integracoes-externas.md)                     | Expectativas sobre ERP, transporte, etc.            |
| [Usuários WMS](./usuarios-wms.md)                                     | Contas e responsabilidade nas operações             |


