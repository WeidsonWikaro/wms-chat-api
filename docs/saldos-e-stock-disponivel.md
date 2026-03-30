# Saldos de inventário e stock “disponível”

## Os três números que você precisa entender

Para cada combinação **produto + localização** (e por vezes **+ unidade de manuseio**), o sistema guarda:

1. **Quantidade em mão** — O que está fisicamente ali (às vezes chamado “on hand”).
2. **Quantidade reservada** — O que já está **comprometido** para ordens liberadas (picking ou transferências), mas que **ainda não saiu** do local.
3. **Disponível** — O que pode ainda ser usado para **novas** reservas. Em termos simples: *disponível = em mão − reservado* (o sistema calcula isso para você).

## O que significa na prática

- **Reservado não é fantasma** — É stock que **ainda está no corredor**, mas já tem dono (uma ordem). Não deve ser contado como “livre” para outro pedido.
- **Picking e transferências** — Quando uma ordem é **liberada**, o sistema **aumenta a reserva** na origem (se houver stock disponível suficiente). Quando a linha é **confirmada** ou executada, faz-se a **baixa física** e baixa-se a reserva em proporção ao que foi retirado.

## Resumo por produto

Você pode pedir um **resumo por produto**: vê totais (em mão, reservado, disponível) e o **detalhe** por cada local e HU. Isso ajuda a:

- Responder “onde está este SKU?”
- Perceber se o problema é **falta real** ou **tudo reservado** para expedição.

## Ajustes manuais diretos ao saldo

Criar ou editar saldos manualmente é operação **sensível** e deve estar restrita a perfis autorizados. Em situações normais, o stock deve mover-se por **recebimento**, **picking**, **transferências**, **contagens** ou **ajustes com motivo** (ver documento de ajustes).

## Dica para operadores

Se o sistema diz **“saldo insuficiente”** ao liberar uma ordem, verifique: pode haver caixas no chão, mas **tudo reservado** para outras ordens, ou o produto está **outro local** do que o indicado na linha.
