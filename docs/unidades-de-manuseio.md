# Unidades de manuseio (paletes, caixas, contentores)

## Para que serve

Uma **unidade de manuseio** (às vezes chamada HU, palete, caixa ou tote) é um objeto físico que **transporta** ou **agrupa** stock. O sistema pode associar stock a uma HU específica numa localização.

## Quando a HU importa no processo

1. **Picking** — Se no mesmo lugar existir **mais de um “monte” do mesmo produto** (por exemplo dois paletes diferentes), a ordem de picking deve dizer **de qual palete (HU) retirar**. Se isso não estiver definido e houver ambiguidade, o sistema não adivinha: é preciso indicar a HU para não retirar do palete errado.
2. **Transferências** — Ao mover stock para uma HU de destino, o sistema pode **atualizar a localização atual** dessa HU para o lugar para onde a mercadoria foi enviada.

## Estados da HU (ideia geral)

- **Vazia** — Pode ser reutilizada.
- **Em uso** — Tem stock ou está alocada a um fluxo.
- **Bloqueada** — Não deve ser usada (avaria, quarentena, inspecção).

## Boas práticas no chão

- **Etiquetar bem** — Código da HU visível e legível.
- **Um propósito por HU** — Evite misturar muitos SKUs numa mesma caixa sem regra; facilita erros no picking.
- **Alinhar com o sistema** — Antes de confirmar uma linha de picking ou transferência, confirme se a ordem pede HU: se sim, bata o código da HU e não só o do produto.

## O que pode correr mal se ignorar a HU

- Retirar mercadoria do **palete errado** quando há dois no mesmo corredor.
- **Transferência** que atualiza a posição da HU de destino de forma incorreta se os dados estiverem trocados.
