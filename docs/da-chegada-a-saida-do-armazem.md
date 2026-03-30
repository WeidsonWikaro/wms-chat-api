# Da chegada à saída do armazém

## Para que serve

Este guia descreve o **caminho completo** da mercadoria dentro do modelo deste WMS: desde a **entrada** no armazém até o momento em que o stock **deixa o endereço** por causa de uma **ordem de picking** (separação para expedição ou outro destino operacional). É uma leitura de “passo a passo” para alinhar equipe de recepção, endereçamento e separação.

Não trata de transporte, faturação ou sistema ERP — só do que o armazém controla: **onde** está o produto e **como** ele se move até sair da posição.

## Visão geral (uma frase)

**Cadastro → recebimento lançado → (endereçamento ou transferência interna) → saldo disponível → ordem liberada com reserva → confirmação de picking com baixa física.**

## O fluxo na ordem certa

### 1. Preparação: o armazém precisa existir no sistema

Antes de qualquer movimento, precisam estar definidos pelo menos:

- **Armazém**, **zonas** (recepção, armazenagem, picking, expedição, etc.) e **localizações** reais no chão.
- **Produtos** com código de barras único (é o que será batido na recepção e no picking).
- Se usam **unidades de manuseio** (palete, caixa) com rastreio fino, o cadastro de **HU** também entra aqui.

Sem isso, não há endereço correto para receber nem para retirar.

*Mais detalhe:* [Armazém, zonas e localizações](./armazem-zonas-e-localizacoes.md), [Produtos](./produtos.md), [Unidades de manuseio](./unidades-de-manuseio.md).

### 2. Chegada do veículo e conferência (processo físico)

Na doca, a equipe confere nota, volumes danificados e quantidades contra o que foi pedido ao fornecedor. Esse passo é **humano**; o sistema entra no passo seguinte.

### 3. Recebimento no sistema (entrada de stock)

1. Abre-se um **recebimento em rascunho** com referência (nota, ASN…), armazém e **local de recepção** (zona típica de doca).
2. Incluem-se as **linhas** (produto e quantidade).
3. Depois da conferência, **lança-se** o recebimento. A partir daí o produto aparece **em mão** naquele local de recepção (neste modelo, entrada **agregada** no endereço, sem HU obrigatória por linha).

Enquanto estiver só em rascunho, ainda não “entrou” stock no sistema.

*Mais detalhe:* [Recebimento de mercadorias](./recebimento-de-mercadorias.md).

### 4. Endereçamento: da recepção para a prateleira

A mercadoria raramente fica para sempre na doca. O próximo passo é **guardá-la** onde vai ser armazenada ou de onde será retirada depois:

- Pode-se pedir uma **sugestão de putaway** (o sistema sugere um endereço em zona de **armazenagem**, priorizando consolidar o mesmo SKU onde já há menos quantidade).
- Na prática, isso pode ser seguido de **transferência interna** (mover do local de recepção para o endereço escolhido), conforme o processo da empresa.

Só depois disso o stock “morar” no corredor certo para o picking.

*Mais detalhe:* [Endereçamento (putaway)](./enderecamento-putaway.md), [Transferências internas](./transferencias-internas.md).

### 5. Stock parado: em mão, reservado e disponível

Com o produto já no endereço, o sistema passa a controlar **quantidade em mão**, **reservada** e **disponível** por combinação produto / local / HU (quando aplicável). Isso decide se uma nova ordem pode **reservar** ou não.

*Mais detalhe:* [Saldos e stock disponível](./saldos-e-stock-disponivel.md).

### 6. Pedido de saída: ordem de picking

Quando há necessidade de separar mercadoria (pedido de cliente, produção, etc.):

1. Monta-se a **ordem de picking** com linhas: produto, quantidade e **local de origem** (e **HU**, se no mesmo local houver mais de um monte do mesmo SKU — senão o sistema pode não saber de qual retirar).
2. **Libera-se** a ordem: o sistema **reserva** a quantidade na origem. Até aqui o material ainda está fisicamente no lugar, mas já está “comprometido” para aquela ordem.
3. Opcionalmente, a ordem entra numa **onda** só para **ordenar prioridades** entre várias ordens; a onda **não substitui** a liberação individual — sem liberar a ordem, não há reserva.

*Mais detalhe:* [Ordem de picking](./ordem-de-picking.md), [Ondas de picking](./ondas-de-picking.md).

### 7. Saída do endereço: o separador confirma

O separador vai ao **local indicado**, confere produto (idealmente com leitor), quantidade e HU se houver, e **confirma** a retirada por linha. Aí o sistema:

- **dá baixa** na quantidade **em mão** naquele endereço;
- **libera a reserva** na mesma proporção (o que saiu deixa de estar “prometido” porque de fato saiu);
- quando todas as linhas estão completas, a ordem fica **concluída**.

Do ponto de vista do WMS, **essa é a saída do stock do armazém** (do endereço). O que acontece depois — carregar caminhão, conferir carga, nota fiscal — é outro processo, muitas vezes fora deste escopo.

*Mais detalhe:* [Linha de picking e confirmação](./linha-de-picking-e-confirmacao.md).

## Um desenho simples do fluxo

```text
Fornecedor / transporte
        │
        ▼
   Doca (recepção) ──► Recebimento lançado (stock “em mão” no local de recepção)
        │
        ▼
   Putaway / transferência interna ──► Endereço de armazenagem ou picking
        │
        ▼
   Stock disponível (e depois reservado quando a ordem é liberada)
        │
        ▼
   Separação (confirmação de picking) ──► Baixa no endereço = saída do stock da posição
```

## Quando o caminho não é linear

- **Transferência interna** sem recebimento novo: move stock entre locais (reabastecimento, correção de endereço).
- **Ajuste de inventário**: corrige diferença entre sistema e realidade com motivo registrado.
- **Contagem cíclica**: valida saldo por tarefa e gera ajustes se houver diferença.

*Mais detalhe:* [Ajustes de inventário](./ajustes-de-inventario.md), [Contagem cíclica](./contagem-ciclica.md).

## Quem costuma participar

| Etapa | Quem costuma estar envolvido |
|-------|------------------------------|
| Cadastro de estrutura e produtos | Gestão do armazém, TI ou master data |
| Recepção e lançamento | Recebedores, conferentes |
| Endereçamento | Operadores de empilhadeira / transpaleteira |
| Liberação de ordens | Planejamento, líder de turno ou regra do ERP |
| Picking e confirmação | Separadores |

## Resumo final

O produto **entra** com o recebimento lançado, **vai para o lugar certo** com putaway/transferência, fica **visível em saldo**, é **reservado** ao liberar a ordem de picking e **sai do endereço** quando o separador **confirma** a retirada. Tudo o mais (carregar, expedir documentação) fecha o ciclo comercial, mas no piso do WMS o “fim” da posição é a **confirmação de picking**.
