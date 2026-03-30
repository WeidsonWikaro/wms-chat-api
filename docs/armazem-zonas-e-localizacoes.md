# Armazém, zonas e localizações

## Para que serve

O sistema precisa de uma hierarquia clara: **armazém → zona → localização**. Sem isso, não é possível dizer onde o stock está, de onde sai ou para onde vai.

## Tipos de zona (conceito de negócio)

As zonas têm um **tipo** que descreve o papel delas no armazém:

- **Armazenagem (STORAGE)** — onde a mercadoria fica guardada a médio prazo.
- **Picking** — zonas de onde se costuma **retirar** mercadoria para expedir pedidos.
- **Recepção** — área onde a mercadoria entra e é conferida.
- **Expedição** — área de consolidação ou saída de cargas.
- **Staging** — zona intermediária (por exemplo preparação ou buffer).

Estes tipos orientam processos como a **sugestão de endereçamento**: o sistema privilegia zonas de armazenagem para consolidar o mesmo produto.

## Boas práticas no dia a dia

1. **Um armazém, uma verdade** — Antes de criar movimentos, confirme que está trabalhando no armazém certo (pedidos de picking e transferências estão ligados ao armazém).
2. **Zonas coerentes** — Não misture funções incompatíveis na mesma zona sem regra clara; isso confunde prioridades de picking e relatórios.
3. **Localizações ativas** — Localizações inativas não devem receber stock novo; alinhe com a equipe antes de desativar um endereço.
4. **Códigos legíveis** — Nomes ou códigos de local devem ser possíveis de ler no chão ou numa etiqueta, à distância de um scanner ou do olho.

## O que o sistema assume

- Toda a movimentação de stock referencia **localizações** (e por vezes **unidades de manuseio**).
- Ordens de picking e transferências usam **origem** e **destino** como localizações concretas; se a informação estiver errada no cadastro, o operador será enviado para o lugar errado.

## Quem faz o quê

| Papel | Responsabilidade típica |
|-------|-------------------------|
| Gestão / WMS | Definir armazéns, zonas e endereços; alinhar tipos de zona com o layout real |
| Operações | Respeitar a estrutura ao colocar ou retirar mercadoria; reportar endereços em falta ou incorretos |

Este módulo é sobretudo **cadastro**. O impacto no stock aparece em outros processos (recebimento, picking, transferências).
