# Ajustes de inventário

## Para que serve

Um **ajuste** corrige o stock quando o sistema e a realidade não coincidem, **fora** de um fluxo normal como recebimento ou picking. Cada ajuste fica **registrado** com **motivo** e **quem** o fez, para auditoria.

## Quando usar

- Quebra, roubo ou deterioração **depois** de confirmada a situação com a supervisão.
- Erro de contagem anterior já corrigido por **contagem cíclica** (nesse caso, o processo preferível é a tarefa de contagem, que gera ajustes automaticamente).
- Entrada ou saída pontual acordada com gestão (sempre com motivo claro por escrito no processo interno).

## Regras de negócio (comportamento esperado)

1. **Delta positivo** — Aumenta a quantidade **em mão** nesse produto/local (e HU, se aplicável). Se não existir saldo nessa combinação, o sistema pode **criar** o registro.
2. **Delta negativo** — Diminui a quantidade **em mão**. Não é permitido ficar com quantidade negativa: se pedir mais do que existe, o sistema recusa.
3. **Motivo obrigatório** — Deve ser descritivo o suficiente para um auditor perceber **porquê** meses depois.

## Boas práticas

- **Nunca** ajuste “para resolver” uma ordem mal criada sem corrigir a ordem em si; isso esconde o problema.
- Prefira **contagem cíclica** quando o desvio for descoberto num inventário rotativo.
- Duas pessoas (contagem + validação) em ajustes de valor alto, conforme a política da empresa.

## Quem costuma fazer

- Supervisor de armazém ou inventário, com permissão explícita; não é tarefa típica de um separador de picking no dia a dia.

