# Regras e guia do projeto — **chat-api**

Documento de referência para humanos e para assistentes de IA (Cursor). Mantém alinhamento com a estrutura real do repositório, stack tecnológica e boas práticas (incluindo SOLID).

**Documentos relacionados:** `WMS-STRUCTURE.md`, `WMS-MODEL.md`, `WMS-FUNCIONALIDADES-TODO.md`.

---

## 1. O que é este projeto

Backend **REST** em **NestJS** que expõe API com prefixo global **`/api`**, documentação **Swagger** em **`/api/docs`**, persistência em **PostgreSQL** via **TypeORM**, e módulo de domínio **WMS** (Warehouse Management System) além de health check e produtos de exemplo.

---

## 2. Stack tecnológica

| Camada | Tecnologia | Notas |
|--------|------------|--------|
| Runtime | Node.js | — |
| Linguagem | **TypeScript** (~5.7, `strict`, `strictNullChecks`) | Sem `any`; preferir tipos explícitos |
| Framework HTTP | **NestJS** 11 | Módulos, DI, pipes, guards |
| ORM | **TypeORM** 0.3 | Entidades, `Repository`, `synchronize` controlado por env |
| Banco | **PostgreSQL** (`pg`) | Códigos de erro mapeados em utilitários HTTP |
| Validação | **class-validator** + **class-transformer** | `ValidationPipe` global (`whitelist`, `forbidNonWhitelisted`) |
| Documentação API | **@nestjs/swagger** | DTOs com `@ApiProperty` |
| Config | **@nestjs/config** | `.env`, `.env.local` |
| Testes | **Jest** + **supertest** | `*.spec.ts` em `src/` |

**Scripts principais:** `yarn start:dev`, `yarn build`, `yarn lint`, `yarn test`, `yarn seed` (build + executar seed).

---

## 3. Estrutura de pastas (`src/`)

```
src/
├── main.ts                 # Bootstrap: prefixo /api, Swagger, porta (default 3001)
├── app.config.ts           # CORS, ValidationPipe global (único lugar)
├── app.module.ts           # ConfigModule, TypeORM, WmsModule, DatabaseSeedModule
├── app.controller.ts       # Health / raiz
├── swagger.setup.ts        # DocumentBuilder, Swagger UI
├── dto/                    # DTOs transversais à app (ex.: health)
├── database/               # Seed de dados (DatabaseSeedModule / DatabaseSeedService)
├── seed.ts                 # Entry CLI para popular o banco
└── modules/wms/            # Domínio WMS (ver seção 4)
```

### Convenções gerais

- **Um ficheiro, uma responsabilidade principal** exportada (padrão Nest).
- **Inglês** nos nomes de código (classes, ficheiros, rotas, colunas), exceto **mensagens de erro/negócio** já estabelecidas em português na API WMS — manter consistência com o que já existe.
- **Comunicação com o utilizador (documentação, commits, PRs)** em **português do Brasil** quando o projeto for documentado em PT-BR.

---

## 4. Módulo WMS (`src/modules/wms`)

### 4.1 Visão de pastas por recurso (feature)

Cada agregado (ex.: `warehouse`, `zone`, `pick-order`) segue:

| Pasta | Responsabilidade |
|-------|------------------|
| `domain/` | Modelo de negócio quando existir; **sem** dependência de TypeORM ou contratos HTTP |
| `persistence/` | Entidades TypeORM (`*.orm-entity.ts`), repositórios concretos |
| `http/dto/` | Contratos JSON: validação + Swagger |
| `http/*.controller.ts` | Rotas, delegação ao service |
| `http/*.service.ts` | Casos de uso, `Repository<>`, mapeamento ORM → DTO de resposta |

### 4.2 `wms/shared/`

- **`shared/domain/`** — enums e tipos partilhados (ex.: `wms.enums.ts`).
- **`shared/http/`** — utilitários só da camada HTTP (`date.util.ts`, `query-failed.util.ts`).

### 4.3 `wms/products/`

Padrão de **repositório com interface**: `products.repository.interface.ts`, `products.tokens.ts`, `TypeormProductsRepository`; service HTTP depende da **abstração** (`IProductsRepository`), não do TypeORM direto — referência de **DIP**.

### 4.4 `wms.module.ts`

- Importa `ProductsModule`.
- `TypeOrmModule.forFeature([...])` com todas as entidades WMS necessárias.
- Regista **controllers** e **providers** (services) dos recursos HTTP do WMS (exceto o que já está dentro de `ProductsModule`).

Detalhe da árvore: ver **`WMS-STRUCTURE.md`**.

---

## 5. HTTP e API

- **Prefixo global:** `/api` (definido em `configureApp` / `main`).
- **Swagger:** `setupSwagger`; rotas documentadas com `@ApiTags`, `@ApiOperation`, `@ApiResponse` nos controllers/DTOs.
- **Validação:** corpo e query validados via DTOs; não confiar só no cliente.
- **Erros de BD:** usar `rethrowDbError` (`shared/http/query-failed.util.ts`) em `save`/`delete` onde fizer sentido, para mapear violações únicas/FK a `ConflictException` / `BadRequestException`.
- **Datas em respostas:** formato ISO string (ex.: `toIso` em `shared/http/date.util.ts`).
- **404:** `NotFoundException` com mensagem clara quando o registo não existe.

---

## 6. SOLID e práticas Nest (resumo objetivo)

| Princípio | Como aplicar neste projeto |
|-----------|----------------------------|
| **S** — Single Responsibility | Controller só orquestra HTTP; service o caso de uso; DTO só formato/validação; entidade ORM só persistência. |
| **O** — Open/Closed | Estender comportamento com novos métodos/DTOs/módulos; evitar alterar classes gigantes sem necessidade. |
| **L** — Liskov | Implementações de repositório respeitam o contrato (`IProductsRepository`). |
| **I** — Interface Segregation | Interfaces de repositório enxutas; não forçar dependências desnecessárias. |
| **D** — Dependency Inversion | Services injetam abstrações (`@Inject(PRODUCTS_REPOSITORY)`); resto usa `Repository<T>` do Nest/TypeORM de forma explícita. |

**Injeção de dependências:** construtores com `readonly`; preferir **uma exportação principal por ficheiro** onde o projeto já segue esse padrão.

**DRY:** reutilizar `shared/http` para erros e datas; não duplicar mapeamentos idênticos sem extrair função privada `map()` no service.

**KISS / YAGNI:** não adicionar camadas (CQRS, eventos) até haver necessidade real; alinhar com o tamanho atual do código.

---

## 7. TypeORM e base de dados

- Variáveis: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_SYNC`, `DB_LOGGING` (ver `app.module.ts`).
- **`synchronize`:** cuidado em produção; o projeto pode usar `true` em dev — documentar risco em deploy.
- **Entidades:** `autoLoadEntities: true`; nomes de tabela explícitos nas entidades quando definidos.
- **Transações:** para operações que alterem várias linhas (futuro: reservas, picking), preferir `QueryRunner` / transação explícita quando houver regra “tudo ou nada”.

---

## 8. Segurança e evolução

- Autenticação/autorização: **não assumir** que já existe; ao adicionar, usar Guards Nest e não espalhar lógica nos controllers.
- CORS: `CORS_ORIGIN` em lista separada por vírgulas (ver `app.config.ts`).
- **Logs:** `Logger` do Nest em bootstrap; evitar `console.log` em código de produção novo.

---

## 9. O que evitar

- Colocar lógica de negócio pesada no **controller**.
- Expor entidade TypeORM diretamente como resposta JSON (usar **DTO de resposta**).
- Usar `any` ou desligar regras do TypeScript sem justificação.
- Criar novo “módulo HTTP monolítico” fora do padrão `feature/http` + `dto` já adotado no WMS.
- Alterar ficheiros só de formatação fora do âmbito do pedido (diff mínimo e focado).

---

## 10. Testes

- **Unitários:** `*.spec.ts` junto à lógica; mocks de repositórios quando testar services.
- **E2E:** `test/jest-e2e.json` — usar o mesmo `configureApp` quando possível para espelhar produção.

---

## 11. Checklist rápido para novas features WMS

1. Definir se é novo recurso ou extensão; se novo, criar `domain/` / `persistence/` / `http/` conforme necessário.
2. DTOs com `class-validator` + Swagger.
3. Service com `try/catch` + `rethrowDbError` onde há escrita em BD.
4. Registar controller e provider em `wms.module.ts` (ou `products.module.ts`).
5. Atualizar `WMS-MODEL.md` / seed se o modelo de dados mudar.
6. `yarn build` e `yarn lint` antes de concluir.

---

## 12. Referência cruzada de documentos

| Ficheiro | Conteúdo |
|----------|----------|
| `WMS-STRUCTURE.md` | Árvore de pastas do WMS |
| `WMS-MODEL.md` | Modelo de dados e regras de negócio |
| `WMS-FUNCIONALIDADES-TODO.md` | Roadmap de funcionalidades |
| `PROJECT-RULES.md` | Este guia (regras do projeto) |

---

*Última atualização: alinhado à estrutura do repositório chat-api (NestJS 11, TypeORM, PostgreSQL, módulo WMS por feature).*
