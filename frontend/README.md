# EduSpace Web

Frontend do EduSpace em React. Arquitetura no
[ADR 0001](../docs/adr/0001-arquitetura-e-stack.md); regras visuais no
[design system](../docs/design/design-system.md).

## Rodar

Pré-requisito: Node.js 24. Para dados reais, a API do `backend/` rodando em `localhost:8000`.

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev          # http://localhost:5173
```

## Comandos

| Comando             | O que faz                                                           |
| ------------------- | ------------------------------------------------------------------- |
| `npm run ci`        | Gate completo: oxlint, Prettier, typecheck, Vitest e build          |
| `npm test`          | Testes (Vitest + Testing Library + MSW)                             |
| `npm run typecheck` | TypeScript estrito                                                  |
| `npm run format`    | Formata com Prettier                                                |
| `npm run gen:api`   | Regera `src/lib/api/schema.d.ts` a partir do OpenAPI da API rodando |
| `npm run e2e`       | Testes E2E com Playwright (veja abaixo)                             |

Rode `npm run gen:api` sempre que o contrato do backend mudar e commite o arquivo gerado. Para
outra origem: `OPENAPI_URL=https://.../openapi.json npm run gen:api`.

## Google Analytics 4 (#49)

Sem `VITE_GA_MEASUREMENT_ID` nada é carregado e o aviso de cookies não aparece (desenvolvimento,
testes e E2E). Com o ID:

- O `gtag.js` só é baixado depois do "Aceitar" (Consent Mode v2 no modo básico): sem aceite,
  nenhuma requisição ao Google e nenhum cookie `_ga`.
- A escolha fica no navegador com data e versão do aviso (`CONSENT_VERSION` em
  `src/lib/analytics/consent-store.ts`); ao mudar o texto de cookies do Aviso de Privacidade,
  troque a versão para perguntar de novo.
- Page views vão pelo padrão da rota (`/recursos/:id`, `/comprovantes/:codigo`). Eventos:
  `login`, `sign_up`, `search`, `reservation_created`, `reservation_cancelled` e
  `receipt_viewed`, sem nome, e-mail, matrícula, id de pessoa ou texto digitado.

Na propriedade do GA4, configure a **retenção de dados em 2 meses** (Administrador, Coleta e
retenção de dados), que é o prazo declarado no Aviso de Privacidade, e deixe os Google Signals
desligados.

## Testes E2E (Playwright)

`npm run e2e` percorre o fluxo principal de ponta a ponta (cadastro, login, busca, grade,
reserva, conflito, comprovante e cancelamento), no desktop e num Pixel 7. Ele sobe sozinho a
API em `:8100` e o front em `:5180`, então roda ao lado do `make dev` e do `npm run dev`.

Pré-requisitos: Postgres do `docker-compose` no ar (`make db-up` no `backend/`), `uv` no `PATH`
e o Chromium do Playwright (`npx playwright install chromium`, uma vez). O banco
`eduspace_e2e` é apagado e recriado com o seed a cada execução; outro banco pode ser indicado em
`E2E_DATABASE_URL`, desde que o nome termine em `_e2e`.

Na falha, trace, vídeo e print ficam em `test-results/` (`npx playwright show-trace ...`). No
GitHub, o workflow `E2E` roda a cada push na `main` e publica esses arquivos como artefato.

## Estrutura

```
src/
  main.tsx               fontes e montagem
  App.tsx                AppProviders (tema, datas pt-BR, TanStack Query, avisos) e roteador
  config.ts              configuração lida do ambiente (VITE_API_URL)
  router/                rotas, caminhos e páginas carregadas sob demanda
  layouts/               AppLayout (nav lateral e inferior) e PublicLayout
  pages/                 uma página por rota: orquestram dados e estado
  components/            UI reutilizável, sem chamadas de rede
  contexts/ hooks/       estado global (avisos; sessão na #16) e hooks
  lib/api/               HttpClient, ApiError, classes por domínio e tipos gerados
  theme/                 tokens e tema MUI do design system
  test/                  setup, servidor MSW e helpers de renderização
```

## Como adicionar uma tela

1. Gere os tipos (`npm run gen:api`) e crie aliases em `src/lib/api/types.ts`.
2. Crie a classe do domínio em `src/lib/api/<dominio>.api.ts` recebendo o `HttpClient` e
   instancie em `src/lib/api/index.ts`.
3. Crie hooks do TanStack Query em `src/hooks/` e invalide as queries após mutations.
4. Crie a página em `src/pages/` com `PageHeader` (título único, breadcrumbs) e registre em
   `src/router/lazy-pages.ts` e `src/router/routes.tsx`.
5. Teste com MSW usando respostas no formato real (listas sempre em `{ items, total, ... }`).
6. Confira o checklist da seção 12 do design system.

## Decisões deste pacote

- **oxlint** no lugar do ESLint (padrão do template atual do Vite): bem mais rápido, com regras
  de TypeScript, React, hooks e acessibilidade; `any` é erro.
- **`fetch` nativo no `HttpClient`** (o axios saiu na #32): menos 13 KB no carregamento de toda
  tela, e o MSW 3 intercepta `fetch` nos testes. O tempo limite usa `AbortSignal.timeout`.
- **Fontes hospedadas no próprio app** (`@fontsource`), sem chamada ao Google Fonts.
- O `openapi-typescript` ainda declara suporte só ao TypeScript 5; um `override` no
  `package.json` o faz usar o TypeScript 6 do projeto. A geração foi validada.
