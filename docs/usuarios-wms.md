# Usuários WMS

## Para que serve

Os **usuários WMS** representam as **pessoas** (ou contas) que o sistema reconhece para **atribuir responsabilidades**: quem criou uma ordem, quem liberou, quem confirmou picking, quem lançou um recebimento, etc.

## Regra geral

- Cada ação sensível deve estar ligada a um **identificador de usuário** válido na política de segurança da empresa (o que o sistema chama ao registrar eventos depende dos campos enviados em cada operação).
- **Criar, alterar ou remover** usuários deve ser restrito a **administração** ou RH + TI, conforme a política da empresa.

## Boas práticas

- **Contas pessoais** — Não compartilhar login entre operadores; em caso de erro ou auditoria, é preciso saber **quem** fez o quê.
- **Desativar em vez de apagar** — Se o modelo permitir, desativar contas de quem saiu evita perder histórico; apagar só quando a política de dados o exigir.

Este módulo é de **cadastro de acesso** e não substitui o processo de **separação** ou **recebimento** descrito em outros guias.
