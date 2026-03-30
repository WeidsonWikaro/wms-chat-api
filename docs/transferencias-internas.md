# Transferências internas (entre locais)

## Para que serve

Uma **ordem de transferência** move stock **dentro** do armazém (ou entre contextos que partilham o mesmo modelo), de um **local de origem** para um **local de destino**. Usa-se para reabastecer picking, enviar para staging, corrigir colocação ou seguir instruções de gestão.

## Estados da ordem

| Estado | O que significa |
|--------|------------------|
| **Rascunho** | Ainda em montagem; **não** reservou stock. |
| **Liberada** | O sistema **reservou** na origem a quantidade de cada linha **em aberto**. |
| **Em andamento** | Pelo menos uma linha já foi **executada** (stock saiu da origem para o destino). |
| **Concluída** | Todas as linhas foram executadas. |
| **Cancelada** | Ordem anulada; nas situações permitidas, **libera reservas** na origem. |

## Fluxo correto

1. **Criar** a transferência com um **código de referência** claro (para a equipe encontrar no terminal ou no papel).
2. **Adicionar linhas**: produto, quantidade, **de onde** e **para onde**, e HU de origem/destino se o processo usar.
3. **Liberar** a transferência — só assim o stock fica **reservado** na origem (precisa haver disponibilidade).
4. **Executar linha a linha** (confirmar cada movimento) quando o operador **fisicamente** move a mercadoria.

## O que acontece ao confirmar uma linha

- Faz-se a **baixa** na origem (com consumo da reserva associada) e o **crédito** no destino.
- Se a linha indica **HU de destino**, o sistema pode **atualizar a posição atual** dessa HU para o local de destino.
- Quando **todas** as linhas estão feitas, a ordem fica **concluída**.

## Cancelamento — atenção

- **Não se cancela** uma transferência **já concluída**.
- Se a transferência está **em andamento** (já houve linhas executadas), o sistema **não** permite cancelar com o comportamento atual: há movimentos já feitos que precisariam de **estorno** explícito (processo a definir pela empresa com supervisão).

Para transferências **liberadas** mas **sem nenhuma linha executada**, o cancelamento **libera as reservas** na origem.

## Relação com picking

Ambos usam **reserva** e **locais**, mas o objetivo é diferente:

- **Picking** — retira para expedir (pedido).
- **Transferência** — move para **outro lugar** dentro da operação.

## Dica prática

Antes de liberar, confira **caminho no chão**: corredores bloqueados ou destino cheio impedem a execução mesmo com reserva feita — evite acumular ordens liberadas que não dá para cumprir.
