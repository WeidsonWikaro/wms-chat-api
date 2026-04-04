# chat-api

API em [NestJS](https://nestjs.com/) para chat (Socket.IO, JWT) com **RAG** sobre documentos Markdown, usando **PostgreSQL** com a extensão **pgvector** para embeddings e busca semântica.

## O que inclui

- Servidor HTTP (prefixo `/api`) e documentação Swagger em `/api/docs` quando a API estiver em execução.
- Integração com LLM/embeddings (Google Gemini via LangChain), de acordo com as variáveis do `.env`.
- Ingestão de arquivos `.md` da pasta `docs/` para a tabela `rag_document_chunks` (comando `rag:ingest`).
- Banco de dados via Docker: imagem `pgvector/pgvector` (Postgres 16 + pgvector).

Documentação extra sobre tamanho de chunks: [RAG-CHUNK-SIZING.md](./RAG-CHUNK-SIZING.md).

## Requisitos

- Node.js (LTS recomendado)
- Yarn ou npm
- Docker (para o Postgres com pgvector)
- Chave **Google AI** (`GOOGLE_API_KEY`) para embeddings e, em geral, para o LLM em desenvolvimento

## Configuração

1. Copie `.env.example` para `.env` na raiz do projeto.
2. Ajuste pelo menos:
   - `JWT_SECRET`
   - `GOOGLE_API_KEY`
   - Variáveis `DB_*` se você não for usar os valores padrão abaixo.

Valores alinhados ao `docker-compose.yml` (desenvolvimento local):

| Variável       | Valor típico |
|----------------|--------------|
| `DB_HOST`      | `127.0.0.1`  |
| `DB_PORT`      | `5433` (mapeamento no `docker-compose.yml`) |
| `DB_USER`      | `postgres`   |
| `DB_PASSWORD`  | `postgres`   |
| `DB_NAME`      | `chat_api`   |
| `DB_SYNC`      | `true` (só dev; em produção use migrações e `false`) |

Opcional para o RAG: `RAG_DOCS_PATH` (padrão: pasta `docs/` na raiz). A dimensão da coluna `vector` vem de uma **chamada de probe** ao modelo de embedding (Gemini), salvo `RAG_VECTOR_DIMENSIONS` se quiseres forçar um valor (ex.: testes).

## Instalar dependências

```bash
yarn install
```

## Subir o Postgres (Docker)

Na raiz do projeto:

```bash
yarn docker:up
```

É o mesmo que `docker compose up -d`. No **host** a porta é **5433** (mapeada para 5432 dentro do container); o banco `chat_api` já vem criado pelo compose.

Comandos úteis: `yarn docker:ps`, `yarn docker:logs`, `yarn docker:down` (os dados persistem no volume `chat_api_pgdata` até o volume ser removido).

## Rodar a API

```bash
# desenvolvimento com reload
yarn start:dev

# produção (após o build)
yarn build && yarn start:prod
```

Por padrão a API escuta na porta definida em `PORT` (ex.: `3001`). Swagger: `http://localhost:3001/api/docs` (ajuste conforme o seu `PORT`).

## Seeds e ingest RAG

Com o container **em execução** e o `.env` correto (incluindo `GOOGLE_API_KEY` para o ingest):

```bash
# Popular dados iniciais (seed)
yarn seed

# Indexar Markdown em docs/ (recursivo) → pgvector
yarn rag:ingest
```

Execute o `rag:ingest` na **raiz do projeto** (a pasta de documentos é resolvida a partir do diretório de trabalho atual). Se não houver arquivos `.md` na pasta configurada, o comando avisa e não grava chunks.

## Consultar o banco no DBeaver (ou outro cliente SQL)

Qualquer cliente PostgreSQL serve; os dados do RAG ficam na tabela **`rag_document_chunks`**.

1. Nova conexão → PostgreSQL.
2. **Host:** `127.0.0.1` · **Port:** `5433` · **Database:** `chat_api` · **User:** `postgres` · **Password:** `postgres`.
3. Testar e salvar.

Exemplo de consulta leve (evita trazer embeddings inteiros sem necessidade):

```sql
SELECT id, source_path, chunk_index, length(content) AS content_len
FROM rag_document_chunks
LIMIT 20;
```

## Scripts npm/yarn

| Script | Descrição |
|--------|-----------|
| `start` / `start:dev` / `start:prod` | Sobe a API NestJS |
| `build` | Compilação TypeScript → `dist/` |
| `seed` | Build + executa seeds (`dist/seed.js`) |
| `rag:ingest` | Build + indexa `docs/` no pgvector |
| `docker:up` / `docker:down` | Sobe ou derruba o container Postgres |
| `docker:logs` | Logs do serviço `db` |
| `test` | Testes unitários |

## Testes

```bash
yarn test
yarn test:e2e
yarn test:cov
```

## Licença

UNLICENSED (projeto privado). O framework NestJS é [MIT](https://github.com/nestjs/nest/blob/master/LICENSE).
