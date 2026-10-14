# EduSpace

[![CI](https://github.com/anderalex93/Sistema-de-Gestao-e-Reserva-de-Recursos-Academicos/actions/workflows/ci.yml/badge.svg)](https://github.com/anderalex93/Sistema-de-Gestao-e-Reserva-de-Recursos-Academicos/actions/workflows/ci.yml)
[![E2E](https://github.com/anderalex93/Sistema-de-Gestao-e-Reserva-de-Recursos-Academicos/actions/workflows/e2e.yml/badge.svg)](https://github.com/anderalex93/Sistema-de-Gestao-e-Reserva-de-Recursos-Academicos/actions/workflows/e2e.yml)

Sistema de gestão e reserva de recursos acadêmicos do Centro Universitário Mário Pontes Jucá (UMJ).
Alunos, professores e a equipe administrativa reservam salas de estudo, laboratórios, auditório e
equipamentos pelo celular, sem planilha, sem fila e sem conflito de horário.

Projeto Integrador I · Análise e Desenvolvimento de Sistemas / Engenharia de Software · 2026

<p>
  <img src="docs/manual/03-busca-resultados.png" width="240" alt="Busca no celular com filtros e a lista de salas encontradas">
  <img src="docs/manual/04-grade.png" width="240" alt="Grade de horários da Sala de estudo 204 com o intervalo das 16:00 às 18:00 selecionado e a barra Reservar este horário">
  <img src="docs/manual/07-minhas-reservas.png" width="240" alt="Minhas reservas com as próximas reservas, botões Ver comprovante e Cancelar">
</p>

Busca, grade de horários e Minhas reservas, no celular. Mais telas, inclusive as da administração,
no [manual do usuário](docs/manual-do-usuario.md).

## O problema e a solução

Hoje a reserva de espaços no campus é feita em formulários de papel ou planilhas. O resultado são
horários em conflito, salas ociosas enquanto outras faltam e tempo de aula perdido na fila da
secretaria.

No EduSpace a pessoa entra com o e-mail institucional, filtra por bloco, tipo de espaço, recursos e
horário, vê a grade de disponibilidade e confirma a reserva com um clique. O comprovante digital
com QR code é apresentado na entrada. O próprio banco de dados impede que dois agendamentos ocupem
o mesmo espaço no mesmo horário, mesmo com acessos simultâneos.

## Acesso

| Ambiente | Endereço | Conta de demonstração |
|---|---|---|
| Produção | Publicação pendente da [#19](https://github.com/anderalex93/Sistema-de-Gestao-e-Reserva-de-Recursos-Academicos/issues/19); passo a passo em [docs/deploy.md](docs/deploy.md) | Admin definido no painel do Render (`SEED_ADMIN_*`) |
| Local com Docker | <http://localhost:8080> (API em <http://localhost:8000/docs>) | `admin@umj.edu.br` / `Eduspace2026` (só local) |

Qualquer pessoa cria a própria conta de aluno com um e-mail `@umj.edu.br`.

## Rodar com Docker em menos de 5 minutos

Pré-requisitos: [Git](https://git-scm.com/) e [Docker](https://www.docker.com/) com Docker Compose.

```bash
git clone https://github.com/anderalex93/Sistema-de-Gestao-e-Reserva-de-Recursos-Academicos.git
cd Sistema-de-Gestao-e-Reserva-de-Recursos-Academicos
docker compose up --build
```

Quando o terminal mostrar `Uvicorn running`, abra <http://localhost:8080>. O Compose sobe o
PostgreSQL (porta 5433), a API (8000, já com as migrações, o catálogo do campus e o admin local)
e o front (8080). Para parar: `Ctrl+C`; para apagar também os dados: `docker compose down -v`.

## Desenvolvimento

Para trabalhar no código, com recarga automática:

- Pré-requisitos extras: [Python 3.13](https://www.python.org/) com [uv](https://docs.astral.sh/uv/),
  [Node.js 24](https://nodejs.org/) e `make` (no Windows, use o Git Bash).
- Backend: [backend/README.md](backend/README.md) (`make install db-up migrate seed dev`).
- Frontend: [frontend/README.md](frontend/README.md) (`npm install && npm run dev`, em
  <http://localhost:5173>).

### Testes

| Comando | Onde | O que roda |
|---|---|---|
| `make ci` | `backend/` | ruff, `mypy --strict` e pytest contra PostgreSQL real, cobertura mínima de 90% |
| `npm run ci` | `frontend/` | oxlint, Prettier, TypeScript estrito, Vitest e build |
| `npm run e2e` | `frontend/` | Playwright: fluxo completo no desktop e num Pixel 7, só com teclado, e auditoria de responsividade e WCAG 2.2 em todas as telas |

O GitHub Actions roda o gate do back, do front, o contrato da API (tipos do front gerados do
OpenAPI), a imagem Docker da API e, à parte, o E2E.

## Escopo do MVP

| Requisito | O que entrega | Issues |
|---|---|---|
| RF01 | Cadastro e login restritos ao e-mail institucional | #15, #16, #17 |
| RF02 | Busca por bloco, tipo, recursos, data e horário; grade de disponibilidade | #20, #21, #22 |
| RF03 | Reserva confirmada na hora, com resumo e comprovante com QR code | #23, #24 |
| RF04 | Cancelamento até 30 minutos antes do início | #25, #26 |
| RNF01 | Interface responsiva, do celular ao desktop, e acessível | #32 |
| RNF02 | Consulta de disponibilidade em até 2 segundos | #33 |
| RNF03 | Nenhuma reserva sobreposta, mesmo com acessos simultâneos | #23 |

Também entram: administração do patrimônio e da agenda (#27, #30, #50), regras de uso
configuráveis (#28), quadro de horários (#51), LGPD (#34) e as páginas públicas (#47, #48). A
ligação de cada requisito com commits e testes está na [matriz de rastreabilidade](docs/rastreabilidade.md).

## Stack

| Camada | Tecnologias |
|---|---|
| Backend | Python 3.13, FastAPI, Pydantic v2, SQLAlchemy 2, Alembic, mypy (strict) |
| Banco de dados | PostgreSQL 16 (exclusion constraint com `btree_gist`) |
| Frontend | React 19, TypeScript, Vite, MUI, TanStack Query, react-hook-form, zod |
| Testes | pytest, Vitest, Testing Library, MSW, Playwright, axe-core, Lighthouse |
| Infraestrutura | Docker, GitHub Actions, Render, Neon, Vercel |

## Arquitetura em uma página

- **Monorepo** com `backend/` e `frontend/`.
- **Backend orientado a objetos:** endpoints finos chamam services (regras de negócio), que usam
  repositórios (acesso a dados) sobre models tipados. Erros de domínio são classes próprias,
  convertidas em resposta HTTP num único ponto.
- **Contrato tipado ponta a ponta:** os tipos TypeScript do front são gerados do OpenAPI da API.
- **Integridade no banco:** uma *exclusion constraint* do PostgreSQL bloqueia reservas sobrepostas.

Diagramas de componentes e do fluxo de uma reserva em [docs/arquitetura.md](docs/arquitetura.md);
decisões e alternativas descartadas no [ADR 0001](docs/adr/0001-arquitetura-e-stack.md).

## Estrutura do repositório

```
backend/          API FastAPI: app/ (endpoints, services, repositories, models), alembic/, tests/
frontend/         Aplicação React: src/ (pages, layouts, components, hooks, lib/api), e2e/ (Playwright)
docs/
  adr/            Decisões de arquitetura
  design/         Design system, protótipo navegável e capturas
  lgpd/           Revisão de privacidade dos endpoints
  modelagem/      DER e dicionário de dados
  qualidade/      Performance, acessibilidade e SEO medidos
  manual/         Prints do manual do usuário
docker/           Script de inicialização do PostgreSQL local
render.yaml       Serviço da API no Render
.github/          Workflows de CI e E2E, templates de issue
```

## Documentação

| Documento | Conteúdo |
|---|---|
| [Manual do usuário](docs/manual-do-usuario.md) | Como reservar, conferir e cancelar; telas da administração |
| [Arquitetura](docs/arquitetura.md) | Componentes, camadas, fluxo de uma reserva e a garantia contra sobreposição |
| [Rastreabilidade](docs/rastreabilidade.md) | Requisito, issue, commit e teste |
| [ADR 0001](docs/adr/0001-arquitetura-e-stack.md) | Stack, camadas, tipagem, contrato da API e convenções |
| [Modelo de dados](docs/modelagem/der.md) | DER e dicionário de dados |
| [Design system](docs/design/design-system.md) | Cores, tipografia, componentes e regras de interface |
| [Deploy](docs/deploy.md) | Neon, Render e Vercel: o que está versionado e o passo a passo |
| Qualidade | [Performance (RNF02)](docs/qualidade/performance.md), [acessibilidade e responsividade (RNF01)](docs/qualidade/acessibilidade-e-responsividade.md), [SEO](docs/qualidade/seo.md) |
| [CONTRIBUTING](CONTRIBUTING.md) | Fluxo de trabalho, padrão de commits e Definição de Pronto |
| Swagger da API | Em `/docs` com a API rodando (<http://localhost:8000/docs>) |

## Equipe

| Integrante | Papel |
|---|---|
| Anderson Alex | Product Owner |
| José Amaral | Scrum Master |
| Ramon Albuquerque | Desenvolvedor Full Stack |

Projeto acadêmico desenvolvido na disciplina Projeto Integrador I do Centro Universitário Mário
Pontes Jucá.
