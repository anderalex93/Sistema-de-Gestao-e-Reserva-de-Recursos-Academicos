# EduSpace

Sistema de gestão e reserva de recursos acadêmicos do Centro Universitário Mário Pontes Jucá (UMJ).
Alunos, professores e a equipe administrativa reservam salas de estudo, laboratórios e
equipamentos em tempo real, sem planilha, sem fila e sem conflito de horário.

Projeto Integrador I · Análise e Desenvolvimento de Sistemas / Engenharia de Software · 2026

## O problema

Hoje a reserva de espaços no campus é feita em formulários de papel ou planilhas. O resultado são
horários em conflito, salas ociosas enquanto outras faltam e tempo de aula perdido na fila da
secretaria.

## A solução

Uma aplicação web responsiva em que a pessoa entra com o e-mail institucional, filtra por bloco,
tipo de espaço, recursos e horário, vê a grade de disponibilidade e confirma a reserva com um
clique. O comprovante digital com QR code é apresentado na entrada da sala. O próprio banco de
dados impede que dois agendamentos ocupem o mesmo espaço no mesmo horário.

## Escopo do MVP

| Requisito | O que entrega | Issues |
|---|---|---|
| RF01 | Cadastro e login restritos ao e-mail institucional | #15, #16, #17 |
| RF02 | Busca por bloco, tipo, recursos, data e horário; grade de disponibilidade | #20, #21, #22 |
| RF03 | Reserva confirmada na hora, com resumo e comprovante | #23, #24 |
| RF04 | Cancelamento até 30 minutos antes do início | #25, #26 |
| RNF01 | Interface responsiva, do celular ao desktop | #32 |
| RNF02 | Consulta de disponibilidade em até 2 segundos | #33 |
| RNF03 | Nenhuma reserva sobreposta, mesmo com acessos simultâneos | #23 |

Apresentação do MVP prevista para **20/11/2026**. O planejamento completo está nas
[issues](https://github.com/anderalex93/Sistema-de-Gestao-e-Reserva-de-Recursos-Academicos/issues),
organizadas em épicos (#1 a #7) e marcos por sprint.

## Stack

| Camada | Tecnologias |
|---|---|
| Backend | Python 3.13, FastAPI, Pydantic v2, SQLAlchemy 2, Alembic, mypy (strict) |
| Banco de dados | PostgreSQL 16 |
| Frontend | React 19, TypeScript, Vite, MUI, TanStack Query, react-hook-form, zod |
| Testes | pytest, Vitest, Testing Library, MSW, Playwright |
| Infraestrutura | Docker Compose, GitHub Actions, Render, Neon, Vercel |

## Arquitetura em uma página

- **Monorepo** com `backend/` e `frontend/`.
- **Backend orientado a objetos:** endpoints finos chamam services (regras de negócio), que usam
  repositórios (acesso a dados) sobre models tipados. Erros de domínio são classes próprias,
  convertidas em resposta HTTP num único ponto.
- **Contrato tipado ponta a ponta:** os tipos TypeScript do frontend são gerados a partir do
  OpenAPI do backend.
- **Integridade no banco:** uma *exclusion constraint* do PostgreSQL bloqueia reservas sobrepostas.

Detalhes e alternativas descartadas no [ADR 0001](docs/adr/0001-arquitetura-e-stack.md).

## Estrutura do repositório

```
backend/     API FastAPI (a partir da issue #10)
frontend/    Aplicação React (a partir da issue #11)
docs/
  adr/       Decisões de arquitetura
  design/    Design system e protótipos
  modelagem/ Modelo de dados
  sprints/   Registros de planning, review e retrospectiva
.github/     Templates de issue e workflows de CI
```

## Como rodar localmente

> O código do backend e do frontend chega nas issues #10 e #11. Esta seção será completada junto
> com elas.

Pré-requisitos:

- [Git](https://git-scm.com/)
- [Docker](https://www.docker.com/) com Docker Compose
- [Python 3.13](https://www.python.org/) e [uv](https://docs.astral.sh/uv/)
- [Node.js 24 LTS](https://nodejs.org/)

```bash
git clone https://github.com/anderalex93/Sistema-de-Gestao-e-Reserva-de-Recursos-Academicos.git
cd Sistema-de-Gestao-e-Reserva-de-Recursos-Academicos
cp .env.example .env          # ajuste os valores se precisar
docker compose up -d db       # PostgreSQL local
```

## Documentação

| Documento | Conteúdo |
|---|---|
| [ADR 0001](docs/adr/0001-arquitetura-e-stack.md) | Stack, camadas, tipagem, contrato da API e convenções |
| [Design system](docs/design/design-system.md) | Cores, tipografia, componentes e regras de interface |
| [CONTRIBUTING](CONTRIBUTING.md) | Fluxo de trabalho, padrão de commits e Definição de Pronto |
| [Swagger da API](http://localhost:8000/docs) | Disponível com o backend rodando |

## Equipe

| Integrante | Papel |
|---|---|
| Anderson Alex | Product Owner |
| José Amaral | Scrum Master |
| Ramon Albuquerque | Desenvolvedor Full Stack |

Projeto acadêmico desenvolvido na disciplina Projeto Integrador I do Centro Universitário Mário
Pontes Jucá.
