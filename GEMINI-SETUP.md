# Passo a passo: Google Gemini + LangChain.js neste projeto (`chat-api`)

Este guia descreve, da conta Google até um exemplo mínimo de código, como usar **Gemini** com **LangChain.js** no backend NestJS. Os pacotes LangChain **ainda não** estão no `package.json` até você implementar o módulo LLM; quando for codar, siga a seção [Dependências](#4-dependências-no-projeto).

---

## Sumário

1. [O que você vai precisar](#1-o-que-você-vai-precisar)
2. [Conta e chave de API (Google AI Studio)](#2-conta-e-chave-de-api-google-ai-studio)
3. [Variáveis de ambiente](#3-variáveis-de-ambiente)
4. [Dependências no projeto](#4-dependências-no-projeto)
5. [Exemplo mínimo com LangChain](#5-exemplo-mínimo-com-langchain)
6. [Integração com NestJS (`ConfigService`)](#6-integração-com-nestjs-configservice)
7. [Escolha do modelo](#7-escolha-do-modelo)
8. [Prototipagem barata](#8-prototipagem-barata)
9. [Problemas comuns](#9-problemas-comuns)
10. [Links oficiais](#10-links-oficiais)

---

## 1. O que você vai precisar

- Conta **Google** (Gmail).
- Navegador para abrir o **Google AI Studio**.
- Este repositório clonado e Node/Yarn funcionando (já usados para `yarn start:dev`).

**Segurança:** a chave de API é **secreta**. Não commite em Git, não compartilhe em prints públicos e não cole em issues.

---

## 2. Conta e chave de API (Google AI Studio)

### 2.1 Acessar o AI Studio

1. Abra **[Google AI Studio](https://aistudio.google.com/)**.
2. Faça login com sua conta Google.

### 2.2 Criar uma API key

1. Vá direto para a página de chaves: **[Get API key](https://aistudio.google.com/apikey)** (ou pelo menu do AI Studio → API keys).
2. Se o assistente pedir, **aceite os termos** ou **associe um projeto** no Google Cloud (o fluxo costuma ser guiado na própria tela).
3. Clique em **Create API key** (ou equivalente).
4. **Copie a chave** e guarde em um gerenciador seguro. Ela só será mostrada integralmente nesse momento em alguns fluxos; se perder, crie outra.

### 2.3 Limites e custo (visão geral)

- O Google costuma oferecer **cota gratuita** para desenvolvimento com limites de uso; valores e regras mudam — consulte sempre a **[página oficial de preços do Gemini API](https://ai.google.dev/pricing)**.
- Para **prototipar barato**, use modelos da família **Flash** (ou **Flash Lite**, quando disponível na API), não os modelos “Pro” mais caros, a menos que precise de raciocínio mais pesado.

---

## 3. Variáveis de ambiente

### 3.1 Arquivo `.env` (local, não versionado)

Na **raiz do projeto** (ao lado do `package.json`), crie ou edite o arquivo **`.env`** e adicione:

```env
GOOGLE_API_KEY=sua-chave-copiada-do-ai-studio
```

A integração **LangChain** com Gemini via pacote oficial costuma reconhecer essa variável (nome padrão usado na documentação).

**Opcional — nome explícito no código:** você pode usar outro nome (ex.: `GEMINI_API_KEY`) e passar manualmente no construtor do modelo; o importante é **não** commitar o valor.

### 3.2 Documentar no `.env.example` (sem segredo)

Para o time saber quais variáveis existem, mantenha no **`.env.example`** apenas um **comentário** ou placeholder, **sem chave real**:

```env
# Google Gemini (LangChain) — crie em https://aistudio.google.com/apikey
# GOOGLE_API_KEY=
```

O projeto já usa `@nestjs/config` com `ConfigModule.forRoot` e `envFilePath: ['.env', '.env.local']` em `src/app.module.ts`, então o Nest carrega o `.env` automaticamente.

---

## 4. Dependências no projeto

Quando for implementar o módulo LLM, instale na raiz do repositório:

```bash
yarn add @langchain/google-genai @langchain/core
```

- **`@langchain/google-genai`:** integração com modelos Google (Gemini) no LangChain.js.
- **`@langchain/core`:** mensagens e tipos base (`HumanMessage`, etc.).

Versões exatas podem ser conferidas no [npm](https://www.npmjs.com/package/@langchain/google-genai). Se no futuro a documentação recomendar outro pacote (migrações acontecem), siga a [documentação oficial de integração JavaScript do LangChain para Google](https://docs.langchain.com/oss/javascript/integrations/chat/google_generative_ai).

---

## 5. Exemplo mínimo com LangChain

Exemplo **fora** do Nest (script ou REPL) só para validar chave e pacotes:

```typescript
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage } from "@langchain/core/messages";

const model = new ChatGoogleGenerativeAI({
  model: "gemini-2.0-flash",
  temperature: 0.2,
});

async function main(): Promise<void> {
  const result = await model.invoke([
    new HumanMessage("Responda em uma frase: o que é um WMS?"),
  ]);
  const text =
    typeof result.content === "string" ? result.content : String(result.content);
  console.log(text);
}

void main();
```

Ajuste o identificador `model` conforme os modelos **disponíveis na sua conta** e na documentação atual (nomes mudam com o tempo).

---

## 6. Integração com NestJS (`ConfigService`)

Padrão recomendado no Nest: injetar configuração em vez de ler `process.env` espalhado.

1. Garanta que **`GOOGLE_API_KEY`** está no `.env`.
2. No serviço do módulo LLM (ex.: `LlmService`), injete `ConfigService` e leia a chave:

```typescript
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

@Injectable()
export class LlmService {
  private readonly model: ChatGoogleGenerativeAI;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>("GOOGLE_API_KEY");
    if (!apiKey) {
      throw new Error("GOOGLE_API_KEY is not set");
    }
    this.model = new ChatGoogleGenerativeAI({
      apiKey,
      model: "gemini-2.0-flash",
      temperature: 0.2,
    });
  }

  // métodos que chamam this.model.invoke(...)
}
```

3. Registre o serviço no `LlmModule` e importe o módulo onde for necessário (ex.: `ChatModule`), respeitando as regras de dependência do Nest.

Assim a mesma base de código funciona em dev (`.env`) e em produção (variáveis no provedor de hospedagem), sem hardcode de chave.

---

## 7. Escolha do modelo

- Para **prototipagem e testes** com **custo baixo**: prefira **Flash** (ou **Flash Lite**, quando listado para a API).
- Para tarefas **mais difíceis** (raciocínio longo, muitas tools): avalie modelos **Pro** com consciência de **preço e latência**.

A lista atual de IDs está na documentação do Google e no AI Studio ao testar modelos.

---

## 8. Prototipagem barata

1. Use **AI Studio** + **Gemini Flash** como caminho principal (nuvem, próximo do ambiente final).
2. Se precisar de **volume enorme de chamadas sem gastar tokens**, considere **Ollama** na sua máquina em paralelo (integração separada no LangChain); não substitui testes de latência de rede na nuvem, mas ajuda a iterar prompts e fluxos.

---

## 9. Problemas comuns

| Sintoma | O que verificar |
|--------|------------------|
| Erro de autenticação / API key inválida | Chave copiada corretamente; variável `GOOGLE_API_KEY` carregada (reinicie o `yarn start:dev` após mudar `.env`). |
| Modelo não encontrado | Nome do modelo (`model: "..."`) compatível com a API e com a região/conta. |
| Cota excedida | Limites do free tier ou billing no Google Cloud; reduza chamadas ou troque de tier/modelo. |
| Chave no Git | Remova do histórico se commitou por engano, **revogue** a chave no console e crie outra. |

---

## 10. Links oficiais

- [Google AI Studio](https://aistudio.google.com/)
- [Criar / gerenciar API keys](https://aistudio.google.com/apikey)
- [Documentação Gemini API](https://ai.google.dev/docs)
- [Preços Gemini API](https://ai.google.dev/pricing)
- [LangChain — integração ChatGoogleGenerativeAI (JavaScript)](https://docs.langchain.com/oss/javascript/integrations/chat/google_generative_ai)
- [Pacote npm `@langchain/google-genai`](https://www.npmjs.com/package/@langchain/google-genai)

---

Quando o módulo LLM existir em `src/modules/llm/`, você pode apontar este arquivo no README ou substituir trechos por links para o código real.
