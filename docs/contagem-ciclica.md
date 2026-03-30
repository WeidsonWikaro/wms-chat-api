# Contagem cíclica (inventário rotativo)

## Para que serve

A **contagem cíclica** é uma forma de **validar** o stock sem parar o armazém inteiro. Cria-se uma **tarefa** (por armazém e, opcionalmente, zona), adicionam-se **linhas** para os produtos e locais a contar, registra-se o que se **contou fisicamente** e, no fim, o sistema **ajusta** as diferenças e **fica registrado** para auditoria.

## Estados da tarefa


| Estado          | Significado                                                                  |
| --------------- | ---------------------------------------------------------------------------- |
| **Aberta**      | Ainda a preparar linhas ou ainda não começou a contagem.                     |
| **Em contagem** | Já foram introduzidas quantidades contadas; em preparação para o fechamento. |
| **Concluída**   | Diferenças aplicadas e tarefa fechada.                                       |
| **Cancelada**   | Tarefa inválida (se o processo interno usar cancelamento).                   |


## Fluxo correto

1. **Criar a tarefa** — Quem planeja define o âmbito (armazém, eventualmente zona).
2. **Adicionar linhas** — Cada linha fixa **produto**, **local** e opcionalmente **HU**. No momento de criar a linha, o sistema registra a quantidade **esperada** com base no **saldo nesse instante** (uma “fotografia” para comparar depois).
3. **Contagem física** — Os operadores contam **sem mexer** no sistema além de anotar; depois introduzem as **quantidades contadas** na tarefa (**submeter contagens**).
4. **Gerar ajustes** — Quando todas as linhas têm quantidade contada preenchida, autoriza-se o **lançamento dos ajustes**: para cada linha, o sistema calcula **contado − esperado** e aplica esse delta no saldo. Linhas **sem diferença** não geram movimento. Cria-se também um **registro de ajuste** por linha com diferença, com motivo ligado à contagem.

## Regras importantes

- **Não se lançam ajustes** antes de submeter todas as contagens — a tarefa precisa estar em estado **em contagem** e **todas** as linhas precisam de quantidade contada preenchida.
- Se uma linha ficar **sem quantidade contada**, o sistema recusa fechar — evita fechar metade da tarefa por engano.
- A linha usa o saldo **na hora de criação** como “esperado”; se entre criar a linha e contar houver **movimentos normais** (picking, recebimento), a diferença reflete **tudo isso**. Por isso, em áreas muito movimentadas, ou se **congela** movimentação na prateleira durante a contagem, ou aceita-se que a diferença pode incluir atividade recente.

## Boas práticas

- Contar **dois a dois** (contador + verificador) em SKUs críticos ou de alto valor.
- Marcar claramente **corredores em contagem** para reduzir movimentos durante o processo.
- Rever diferenças **grandes** antes de lançar — pode ser erro de local, HU trocada ou typo na introdução.

## Quem faz o quê


| Papel        | Tarefa                                             |
| ------------ | -------------------------------------------------- |
| Planejamento | Cria tarefa e linhas (o quê e onde contar)         |
| Operadores   | Contagem física e introdução fiel dos números      |
| Supervisor   | Valida diferenças anômalas e autoriza o fechamento |


