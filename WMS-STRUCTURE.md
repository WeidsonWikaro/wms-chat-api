# Estrutura do módulo WMS (`src/modules/wms`)

Este documento descreve a organização por **recurso (feature)** e o papel de cada pasta. O objetivo é manter o código de domínio, persistência e API HTTP próximos e fáceis de localizar.

## Visão geral

```
wms/
├── wms.module.ts              # Agrega entidades TypeORM, controllers e services de todos os recursos
├── shared/                    # Código partilhado entre recursos
│   ├── domain/                # Enums e tipos de domínio transversais (ex.: wms.enums.ts)
│   └── http/                  # Utilitários só usados pela camada HTTP (datas ISO, erros de BD)
├── <recurso>/                 # Um diretório por agregado (ex.: warehouse, zone, pick-order)
│   ├── domain/                # Entidades de domínio (quando existirem)
│   ├── persistence/           # Mapeamento ORM (TypeORM): entidades, colunas, relações
│   └── http/                  # API REST deste recurso
│       ├── dto/               # Contratos de entrada/saída (JSON) + validação + Swagger
│       ├── *.controller.ts    # Rotas HTTP (Nest)
│       └── *.service.ts       # Casos de uso / orquestração (repositórios, mapeamento para DTOs)
└── products/                  # Produtos (mesmo padrão: domain, persistence, http, módulo próprio)
```

## `shared/`

| Pasta / ficheiro | Conteúdo esperado |
|------------------|-------------------|
| `shared/domain/` | Enums e conceitos de negócio usados por vários recursos (ex.: tipos de zona, estados de picking). Evitar dependências de HTTP ou ORM. |
| `shared/http/` | Funções auxiliares para a camada HTTP que não pertencem a um recurso só (ex.: `toIso` para respostas, `rethrowDbError` para mapear erros PostgreSQL → HTTP). |

## Por recurso: `<nome-do-recurso>/`

### `domain/`

Modelo de negócio **independente** de como os dados são guardados ou expostos na API (entidades de domínio, value objects). Nem todos os recursos têm ficheiros aqui; quando existem, devem evitar importar TypeORM ou DTOs de request/response.

### `persistence/`

Tudo o que liga o domínio ao **armazenamento**:

- Entidades TypeORM (`*.orm-entity.ts`)
- Repositórios concretos (ex.: `typeorm-products.repository.ts` no recurso `products`)

Alterações de schema, índices ou detalhes de SQL/ORM concentram-se aqui.

### `http/`

Camada **REST** do recurso:

| Elemento | Função |
|----------|--------|
| `dto/` | **Data Transfer Objects**: classes com `class-validator` e `@ApiProperty` para documentar e validar o JSON de pedidos e respostas. Não são a “entidade de negócio” nem a tabela; são o contrato público da API. |
| `*.controller.ts` | Define rotas, parâmetros, códigos HTTP e delega no service. |
| `*.service.ts` | Implementa listar, obter, criar, atualizar, remover; usa repositórios/`Repository<>`; mapeia entidades ORM → DTOs de resposta. |

Convém **não** colocar SQL ou regras pesadas no controller; o service coordena.

## `products/`

O recurso **produtos** segue o mesmo esquema:

- `domain/`, `persistence/`, `products.repository.interface.ts`, `products.tokens.ts` na raiz do recurso
- `http/dto/`, `http/products.controller.ts`, `http/products.service.ts`
- `products.module.ts` regista o controller, o service e o repositório

## `wms.module.ts`

Importa `ProductsModule`, regista todas as entidades WMS em `TypeOrmModule.forFeature` e declara os **controllers** e **providers** (services) dos recursos que não são o `ProductsModule` (que já exporta o seu próprio controller).

## Referências cruzadas

- DTOs que usam enums partilhados importam de `shared/domain/` (caminho relativo conforme a profundidade, tipicamente `../../../shared/domain/wms.enums` a partir de `*/http/dto/`).
- Services HTTP importam utilitários de `shared/http/` (ex.: `../../shared/http/date.util` a partir de `*/http/*.service.ts`).
