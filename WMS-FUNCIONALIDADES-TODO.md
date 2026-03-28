# Roadmap WMS — funcionalidades (simples → complexas)

Use os checkboxes abaixo para acompanhar o que já foi feito. Marque `- [x]` quando uma atividade estiver **concluída** (implementação + testes manuais ou automáticos aceitos).

---

## 1. Ajuste de inventário

**O que é:** permitir registrar correções de quantidade no estoque (entrada/saída ou ajuste positivo/negativo) em uma localização e, se aplicável, em uma unidade de manuseio (HU), **com motivo** e rastreabilidade (quem/quando).

**Por que importa:** base para alinhar sistema e estoque físico antes de processos mais automáticos.

- [ ] **Status:** pendente

---

## 2. Reserva de estoque

**O que é:** ao planejar picking (ou transferência), **reservar** quantidade no saldo (ex.: campo `quantityReserved` ou equivalente), impedindo que o mesmo estoque seja prometido duas vezes.

**Por que importa:** evita over-commit e conflitos entre pedidos.

- [ ] **Status:** pendente

---

## 3. Confirmação de picking

**O que é:** registrar o que foi efetivamente separado (`quantityPicked`), atualizar status da linha (ex.: OPEN → DONE), e **baixar** estoque / liberar reserva de forma consistente com as regras definidas.

**Por que importa:** fecha o ciclo operacional do pedido de separação.

- [ ] **Status:** pendente

---

## 4. Confirmação de transferência

**O que é:** efetivar a movimentação entre locais/HUs conforme a linha de transferência (ou encerrar o fluxo com atualização de saldo explícita, conforme o desenho escolhido).

**Por que importa:** materializa a transferência interna no estoque.

- [ ] **Status:** pendente

---

## 5. Recebimento simples

**O que é:** entrada de mercadoria em local de **recebimento** (doca/área), **sem** fluxo completo de ASN — foco em registrar quantidades e produto no depósito.

**Por que importa:** entrega valor rápido sem integração pesada com fornecedor.

- [ ] **Status:** pendente

---

## 6. Putaway básico

**O que é:** após o recebimento, definir ou sugerir **para qual localização** o material deve ir (regra simples: zona fixa, proximidade, capacidade mínima, etc.).

**Por que importa:** organiza o depósito após a entrada.

- [ ] **Status:** pendente

---

## 7. Contagem cíclica

**O que é:** tarefas de inventário por amostragem ou rodízio, confronto entre contagem física e sistema, e geração de **ajuste** quando houver diferença.

**Por que importa:** melhora acurácia contínua sem parar o armazém inteiro.

- [ ] **Status:** pendente

---

## 8. Ondas / priorização de picking

**O que é:** agrupar pedidos em **ondas**, definir prioridades, sequência de coleta e alocação mais elaborada de tarefas.

**Por que importa:** ganho de produtividade em operações maiores.

- [ ] **Status:** pendente

---

## 9. Integrações

**O que é:** conectar o WMS a sistemas externos — ERP, transportadora, impressão de etiquetas, leitores (código de barras/RFID), APIs de terceiros.

**Por que importa:** escala o uso em produção, mas aumenta escopo, contratos e testes.

- [ ] **Status:** pendente

---

## Notas

- Ordem sugerida de implementação segue a numeração acima (do mais simples ao mais complexo).
- Ao concluir um item, marque o checkbox e, se quiser, adicione uma linha `**Concluído em:** data` abaixo do item.
