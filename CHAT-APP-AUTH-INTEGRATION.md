# Passo a passo — integrar autenticação JWT no **chat-app** (Next.js)

Use este ficheiro como **prompt de contexto** no Cursor (chat do projeto **chat-app**): cole ou referencie o caminho deste repositório (`chat-api/CHAT-APP-AUTH-INTEGRATION.md`) e peça para implementar os passos abaixo.

## Contexto da API (chat-api)

- **Base URL** (exemplo local): `http://localhost:3001/api` (prefixo global `/api`).
- **Login:** `POST /api/auth/login` — JSON `{ "code": string, "password": string }`.
- **Refresh (rotação):** `POST /api/auth/refresh` — JSON `{ "refreshToken": string }`. Cada resposta devolve um **novo** `refreshToken`; o anterior fica revogado — **substituir sempre** o valor guardado no cliente.
- **Logout:** `POST /api/auth/logout` — JSON `{ "refreshToken": string }` — `204 No Content`.
- **Resposta de tokens** (`200`): campos `accessToken`, `refreshToken`, `tokenType` (`Bearer`), `accessExpiresIn`, `refreshExpiresIn` (strings — valores vêm do backend; em teste o refresh pode ser `10m`, em produção típico `7d` via env).
- **REST protegido:** header `Authorization: Bearer <accessToken>`.
- **WebSocket** (`/chat`, Socket.IO): no handshake, `auth: { token: "<accessToken>" }` (o mesmo JWT de acesso; o payload inclui `sub` = UUID do utilizador e `role`).
- **Rotas públicas na API:** `GET /api/health`, `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout`, e (se ativo) `POST /api/chat/dev-token`.
- **Papéis** (`role` no JWT e na BD): `VIEWER`, `OPERATOR`, `ADMIN`. Exemplo de rota restrita na API: `GET /api/integrations/status` exige **`ADMIN`** — com outro papel deve devolver **403**.
- **CORS:** a origem do Next (ex. `http://localhost:3000`) deve estar em `CORS_ORIGIN` no backend; `credentials: true` já está ativo no servidor.

## Credenciais de desenvolvimento (após `yarn seed` no chat-api)

| Código   | Palavra-passe | Role      |
|----------|-----------------|-----------|
| `U-ALICE` | `DevPass#2026` | `ADMIN`   |
| `U-BOB`   | `DevPass#2026` | `OPERATOR`|
| `U-CAROL` | `DevPass#2026` | `VIEWER`  |

## Variáveis de ambiente no chat-app (Next.js)

Definir pelo menos:

- `NEXT_PUBLIC_API_URL` — URL base da API **sem** o sufixo `/api` se as tuas funções de fetch já acrescentam `/api`, ou com `/api` se preferires uma única base; **ser consistente** em todo o cliente.
- Opcional: `NEXT_PUBLIC_WS_URL` se o WebSocket não for a mesma origem/porta que o REST.

Documentar no `.env.example` do chat-app.

---

## Tarefas para o Cursor implementar no chat-app

### 1) Contratos TypeScript

Criar tipos alinhados à API, por exemplo:

- `AuthTokensResponse`: `accessToken`, `refreshToken`, `tokenType`, `accessExpiresIn`, `refreshExpiresIn`.
- `LoginRequest`: `code`, `password`.
- `RefreshRequest`: `refreshToken`.

### 2) Armazenamento seguro dos tokens no browser

- **Access token:** memória (React state/context) ou `sessionStorage` (aceitável em dev); evitar `localStorage` se quiser reduzir janela XSS.
- **Refresh token:** `httpOnly` cookie só é possível se a API emitir cookie (não é o caso atual — a API devolve JSON). Portanto: **`localStorage` ou `sessionStorage`** para `refreshToken`, com consciência do risco, **ou** memória + refresh apenas quando a aba está aberta.
- Implementar **uma** camada (`authStorage.ts` ou similar) com `get/set/clear` para não espalhar chaves mágicas.

### 3) Cliente HTTP autenticado

- Função `fetch`/`axios` base que:
  - anexa `Authorization: Bearer <accessToken>` quando existir token;
  - em **401**, tenta **uma vez** `POST /auth/refresh` com o `refreshToken` guardado, grava o novo par, repete o pedido original;
  - se o refresh falhar, limpa sessão e redireciona para a página de login (ou equivalente).

### 4) Fluxo de login e logout

- Página ou formulário: chamar `POST /api/auth/login`, guardar tokens, redirecionar para a área autenticada.
- Logout: chamar `POST /api/auth/logout` com o `refreshToken` atual (melhor esforço), limpar armazenamento local, resetar estado.

### 5) Socket.IO /chat

- Ao criar o cliente (`io(...)`), passar `auth: { token: accessToken }`.
- Quando o access token for renovado pelo refresh, **reconectar** ou atualizar o socket conforme a biblioteca em uso (muitas vezes `socket.auth = { token }; socket.connect()`).
- Garantir que `NEXT_PUBLIC_API_URL` / URL do socket aponta para o mesmo host que serve o namespace `/chat`.

### 6) UI mínima

- Rota `/login` (ou modal) com campos código + palavra-passe.
- Proteção de rotas: layout ou middleware que exige sessão; se não houver access token (e refresh falhar), mostrar login.

### 7) Teste manual rápido

1. Login com `U-ALICE` / `DevPass#2026`.
2. Chamada autenticada a um endpoint WMS (ex. `GET /api/wms-users` ou produtos) com Bearer.
3. Chamada a `GET /api/integrations/status` — deve **200** com Alice.
4. Login com `U-CAROL`, repetir `GET /api/integrations/status` — deve **403**.
5. Abrir chat WebSocket com o access token e enviar uma mensagem.
6. Simular access token expirado (apagar da memória ou esperar) e confirmar que o cliente renova via refresh e recupera.

---

## Prompt sugerido para colar no Cursor (chat-app)

> O backend está documentado em `CHAT-APP-AUTH-INTEGRATION.md` do repositório chat-api. Implementa no Next.js: tipos de auth, armazenamento de tokens, cliente HTTP com refresh automático em 401, login/logout, integração do Socket.IO `/chat` com `auth.token`, e uma página de login. Usa as variáveis `NEXT_PUBLIC_API_URL` (e WS se necessário). Não assumes cookies httpOnly para refresh — a API devolve `refreshToken` no JSON. Segue os padrões já existentes no chat-app (App Router, fetch, etc.).

---

*Gerado para alinhar o frontend **chat-app** com a API **chat-api** após introdução de JWT, guards globais, roles e refresh com rotação.*
