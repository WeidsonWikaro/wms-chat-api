# Endereçamento (putaway) — onde guardar o que chegou

## Para que serve

Depois de receber mercadoria na zona de recepção, é preciso **guardá-la** num lugar adequado. A **sugestão de putaway** ajuda a escolher um **endereço de armazenagem** dentro das zonas de tipo **armazenagem (STORAGE)** do armazém.

## Como o sistema decide (regra de negócio)

A sugestão usa uma heurística simples e transparente:

- Considera todas as **localizações ativas** que pertencem a zonas **STORAGE** daquele armazém.
- Para o **produto** que vai guardar, soma a quantidade **em mão** em cada uma dessas localizações.
- **Sugere o endereço onde esse produto já tem menos quantidade** — a ideia é **consolidar** o mesmo SKU no mesmo lugar quando faz sentido, reduzindo dispersão.

## O que isto **não** é

- Não substitui regras de **rotação** (FIFO/FEFO) se a operação exigir — isso pode ser combinado com políticas de picking ou etiquetas de lote em outros processos.
- Não bloqueia locais cheios ou estruturas frágeis — quem opera no chão continua a ter de validar se o endereço está **acessível e seguro**.

## Boas práticas no chão

1. Pedir a sugestão **antes** de deslocar a HU ou a caixa para o fundo do armazém.
2. Se a sugestão for **impraticável** (corredor fechado, manutenção), escolha outro endereço STORAGE e comunique à equipe para manter o mapa mental do armazém alinhado.
3. Depois de colocar fisicamente, o stock deve se refletir por **transferência interna** ou pelo processo que usarem para mover do recebimento para o endereço final (conforme o fluxo da empresa).

## Ligação com o resto

- Recebimento coloca stock na **recepção**.
- Putaway diz **para onde** ir a seguir dentro da armazenagem.
- **Picking** retira mais tarde de **locais de origem** definidos nas linhas (muitas vezes zonas de picking ou armazenagem, conforme cadastro).
