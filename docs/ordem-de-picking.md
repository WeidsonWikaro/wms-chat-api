# Ordem de picking — como funciona e em que ordem fazer as coisas

## O que é uma ordem de picking

É um **pedido de separação**: uma lista de tarefas (linhas) para retirar produtos de **locais de origem** no armazém, normalmente para expedir um pedido de cliente ou alimentar a produção. Cada ordem tem um **número** identificável, um **armazém** e um **estado** que diz em que fase está.

## Estados da ordem (ciclo de vida)

| Estado | Significado para quem está no chão |
|--------|-----------------------------------|
| **Rascunho** | Ainda não “pegou” no stock. Pode estar incompleta; **não pode** reservar mercadoria até ser liberada. |
| **Liberada** | O sistema **reservou** a quantidade pedida em cada linha, no local de origem indicado. Já pode começar a separar. |
| **Em separação** | Já houve pelo menos uma confirmação de retirada numa linha; a ordem está sendo executada. |
| **Separada / concluída** | Todas as linhas foram totalmente satisfeitas. |
| **Cancelada** | A ordem deixou de ser válida; as reservas pendentes foram liberadas conforme as regras. |

## O que tem de estar certo **antes** de liberar

1. **Todas as linhas criadas** — Não se libera uma ordem **sem linhas**.
2. **Cada linha com local de origem** — Sem endereço de onde retirar, o sistema não consegue reservar.
3. **Stock disponível** — Na origem (e HU, se a linha for específica), precisa haver **quantidade disponível** pelo menos igual ao pedido. Caso contrário, a liberação falha: é preciso corrigir a linha, o local ou receber mais stock.
4. **Várias HU no mesmo lugar** — Se no mesmo local existem **vários montes** do mesmo produto em HUs diferentes e a linha **não** diz qual é a HU, o sistema pode recusar a operação por **ambiguidade**. Nesse caso, a linha precisa identificar a **unidade de manuseio** de origem.

## Liberação (o passo crítico)

**Liberar** a ordem é o momento em que o sistema **marca** a mercadoria como comprometida: aumenta a **reserva** no saldo de cada linha. Até aqui, outras ordens podiam usar esse stock; depois de liberada, esse montante fica **reservado** para esta ordem.

## Cancelamento

- **Não se cancela** uma ordem já **totalmente separada** (concluída).
- Se cancelar uma ordem **liberada** ou **em separação**, o sistema **devolve as reservas** que ainda faziam sentido (quantidades ainda não retiradas) para ficarem disponíveis para outros pedidos.

## Prioridade e ondas

A **prioridade** da ordem pode ser usada para decidir **por onde começar** quando há muitas ordens. Uma **onda de picking** pode **reordenar** prioridades de um conjunto de ordens (ver documento de ondas); isso **não** substitui a **liberação** individual de cada ordem para reservar stock.

## Papel do separador

O separador **não** “libera” sozinho se o processo da empresa reservar isso ao líder de turno ou ao sistema ERP. O separador **consulta** a ordem (por número), **vê as linhas** e, quando a ordem está **liberada ou em separação**, **confirma** cada retirada nas **linhas de picking** (ver documento próprio).

## Resumo de uma frase

**Primeiro** a ordem precisa estar **montada e correta**; **depois** **libera-se** para reservar stock; **só então** se confirma linha a linha o que foi fisicamente retirado.
