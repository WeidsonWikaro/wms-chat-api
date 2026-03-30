# Integrações externas (ERP, transporte, etiquetas)

## O que o sistema faz hoje

O módulo de **integrações** existe para, no futuro, ligar o armazém a sistemas externos — por exemplo **ERP**, **transportadoras**, **impressão de etiquetas** ou **leitores de código de barras** em rede.

Neste projeto, o estado das integrações é **informativo** (placeholder): indica que **não há conectores reais configurados** e que qualquer ligação passaria a ser desenvolvida ou configurada em outra fase.

## O que significa para o dia a dia

- **Processos de stock** (recebimento, picking, transferências, contagens) funcionam **dentro desta API** com as regras descritas nos outros documentos.
- **Dados mestres** (produtos, clientes, pedidos de venda) podem, num cenário real, vir do ERP — aqui deve assumir-se que **cadastro e ordens** já foram criados ou importados por processos separados, conforme a implementação da empresa.

## Boas práticas organizacionais

- Mesmo sem integração automática, mantenha **o mesmo código de artigo** entre sistema de vendas e WMS para evitar duplicados.
- Defina **quem é a fonte de verdade** para quantidades (por exemplo ERP vs WMS) antes de ligar sistemas em produção.

Quando existir integração real, este documento deve ser **substituído ou complementado** por manuais específicos de cada interface (filas, erros, reprocessamento).
