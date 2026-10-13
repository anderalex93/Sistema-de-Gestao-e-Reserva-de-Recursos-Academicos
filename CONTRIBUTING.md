# Como contribuir com o EduSpace

Este guia resume como o trabalho acontece no repositório. As decisões técnicas completas estão no
[ADR 0001](docs/adr/0001-arquitetura-e-stack.md) e as regras visuais no
[design system](docs/design/design-system.md).

## Fluxo de trabalho

O projeto usa **trunk-based development**: todo o trabalho vai direto para a branch `main`, sem
pull requests. Os gates locais e o CI são a rede de segurança.

1. Escolha uma issue do marco da sprint atual e mova o card para **Em andamento** no quadro.
   Respeite a seção "Bloqueado por" da issue.
2. Atualize a `main` antes de começar:
   ```bash
   git pull origin main
   ```
3. Faça commits pequenos e atômicos enquanto trabalha.
4. Rode o gate do projeto que você alterou (veja abaixo). Só envie com tudo verde.
5. Envie:
   ```bash
   git pull --rebase origin main
   git push origin main
   ```
6. Confira se o CI ficou verde. Se quebrou, a correção vira a prioridade.
7. O commit que termina a tarefa fecha a issue (`closes #N`). Mova o card para **Pronto**.

## Mensagens de commit

[Conventional Commits](https://www.conventionalcommits.org/), em inglês, com uma linha:

```
<tipo>(<escopo opcional>): <descrição no imperativo>
```

| Tipo | Quando usar |
|---|---|
| `feat` | Funcionalidade nova |
| `fix` | Correção de bug |
| `refactor` | Mudança interna sem alterar comportamento |
| `test` | Testes novos ou ajustados |
| `docs` | Documentação |
| `chore` | Configuração, dependências, tarefas de manutenção |
| `perf` | Melhoria de desempenho |
| `ci` | Workflows do GitHub Actions |

Exemplos:

```
feat(auth): restrict signup to institutional email domains (closes #15)
fix(reservations): return 409 when the exclusion constraint fails
docs(adr): record token storage decision
```

## Gates locais

| Parte | Comando | O que roda |
|---|---|---|
| Backend | `make ci` (em `backend/`) | ruff check, ruff format --check, mypy --strict, pytest |
| Frontend | `npm run ci` (em `frontend/`) | ESLint, typecheck, Vitest, build |

Os comandos passam a existir com as issues #10 e #11.

## Definição de Pronto

Uma tarefa de código só está pronta quando:

- [ ] Todos os critérios de aceite da issue foram atendidos
- [ ] Há testes automatizados cobrindo os critérios de aceite
- [ ] O gate local está verde e o CI ficou verde depois do push
- [ ] O commit final cita a issue (`closes #N`)
- [ ] A funcionalidade foi verificada no ambiente publicado, quando ele já existir
- [ ] Telas novas passaram pelo checklist da seção 12 do design system

## Convenções de código

- **Idioma:** classes, funções e variáveis em inglês. Tabelas, colunas, campos JSON da API e
  enums de domínio em português `snake_case` (`reserva`, `recurso_id`, `CONFIRMADA`). Textos de
  interface em português.
- **Backend:** endpoint → service → repository → model, com dependências injetadas pelo
  construtor. Services lançam erros de domínio (`DomainError`), nunca `HTTPException`.
- **Tipagem:** `mypy --strict` no backend; TypeScript `strict` sem `any` no frontend. Tipos da
  API gerados do OpenAPI (`npm run gen:api`), nunca escritos à mão.
- **Testes do backend** rodam contra PostgreSQL real. SQLite não é permitido.
- **Segredos** só em variáveis de ambiente. O arquivo `.env` nunca é versionado; documente
  variáveis novas no `.env.example`.

## Issues

Use os templates ao abrir uma issue: **Bug**, **Funcionalidade** ou **Tarefa técnica**.

| Label | Significado |
|---|---|
| `P0-mvp` | Obrigatório para a apresentação de 20/11 |
| `P1-desejável` | Entra se houver tempo antes do code freeze (18/11) |
| `P2-pós-mvp` | Fica para depois da apresentação |
| `tipo:*` | Natureza do trabalho (feature, infra, docs, teste, gestão) |
| `area:*` | Parte do sistema (backend, frontend, devops, design) |
| `tamanho:P/M/G` | Até 4h / 1 a 2 dias / 3 a 5 dias |
| `hitl` | Depende de decisão ou validação da equipe |
| `epic` | Agrupa as issues de uma frente de trabalho |

## Quadro

Colunas: **Backlog → A fazer → Em andamento → Em revisão → Pronto**. "Em revisão" é usado para
tarefas que dependem de validação do PO (wireframes, modelagem, textos).

Quadro: [EduSpace MVP](https://github.com/users/rdalbu/projects/1), com os campos Status, Sprint,
Prioridade e Tamanho. Issue nova entra pelo template e deve ser adicionada ao quadro.
