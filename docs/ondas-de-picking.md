# Ondas de picking

## Para que serve uma onda

Uma **onda** agrupa várias **ordens de picking** do mesmo **armazém** para planejar o trabalho em bloco — por exemplo “tudo o que sai de manhã” ou “rota A do corredor”. Ajuda a definir **em que ordem** tratar as ordens quando há mais de uma.

## O que a onda faz no sistema (e o que não faz)

**Quando libera a onda** (passo de gestão ou planejamento):

1. O sistema associa um **número de sequência** a cada ordem na onda (**sort order** — ordem de execução desejada).
2. Atribui **prioridades** às ordens de picking de forma **sequencial**: começa na prioridade base da onda e incrementa (primeira ordem, segunda, …). Assim, na lista de trabalho, fica claro **qual ordem tratar primeiro**, **segunda**, e por aí fora.
3. Marca a onda como **liberada** ao nível de planejamento.

**O que a onda não faz sozinha**

- **Não reserva stock** no armazém. Cada ordem de picking continua a precisar do passo **liberar ordem** para criar as **reservas** nas linhas. A onda organiza **prioridades** e **agrupamento**, não substitui a liberação de stock.

## Boas práticas

1. **Montar a onda em rascunho** — Incluir todas as ordens necessárias e verificar se pertencem ao **mesmo armazém** (o sistema recusa misturar armazéns).
2. **Definir a sequência** — Quem planeja coloca as ordens na ordem em que quer que o chão as execute (por exemplo por rota de picking).
3. **Liberação da onda** — Quando o lote estiver pronto para execução.
4. **Depois**, **liberar cada ordem de picking** (ou conforme o processo interno) para que as reservas existam antes dos separadores começarem.

## Erro comum

Achar que “liberar a onda” **já bloqueou** a mercadoria para todas as ordens. Neste modelo, é preciso **ainda** o passo de **liberação da ordem** para o stock ficar reservado linha a linha.

## Quem usa mais

- **Planeamento** ou **líder de turno** — monta ondas e sequências.
- **Separadores** — seguem a prioridade que resulta da onda, mas o guia operacional continua a ser a **ordem** e as **linhas** (documentos de picking).
