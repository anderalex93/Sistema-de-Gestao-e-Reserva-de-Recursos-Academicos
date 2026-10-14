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

## O que tem de diferente

- **Check-in pelo QR da porta.** Cada sala tem um QR fixado na entrada. Quem reservou lê o código
  ao chegar; sem check-in em 15 minutos, a reserva é liberada e a sala volta para o campus. Ataca
  a sala reservada e vazia, a outra metade do problema (#43).
- **Painel de ocupação.** Mapa de calor da semana, comparecimento, horas devolvidas pelo check-in,
  espaços mais e menos usados e CSV para a administração decidir com dados (#44).
- **Conflito impossível por construção.** Uma exclusion constraint do PostgreSQL impede duas
  reservas no mesmo horário, mesmo com cliques simultâneos (RNF03).
- **A demo é um teste.** O roteiro da apresentação roda inteiro, com dois navegadores, a cada push
  ([docs/apresentacao/roteiro.md](docs/apresentacao/roteiro.md)).

## O problema e a solução

Hoje a reserva de espaços no campus é feita em formulários de papel ou planilhas. O resultado são
horários em conflito, salas ociosas enquanto outras faltam e tempo de aula perdido na fila da
secretaria.

No EduSpace a pessoa entra com o e-mail institucional, filtra por bloco, tipo de espaço, recursos e
horário, vê a grade de disponibilidade e confirma a reserva com um clique. O comprovante digital
com QR code é apresentado na entrada. O próprio banco de dados impede que dois agendamentos ocupem
o mesmo espaço no mesmo horário, mesmo com acessos simultâneos.

## Como rodar

Escolha um dos dois caminhos. Os dois funcionam no Windows, no macOS e no Linux.

| Caminho | Para quem | Precisa instalar |
|---|---|---|
| **A. Só Docker** | Quer ver o sistema funcionando, sem mexer no código | Git e Docker |
| **B. `make run`** | Vai programar e quer recarga automática ao salvar | Git, Docker, Python 3.13 com uv, Node.js 24 e make |

### Caminho A: só Docker

1. Instale o [Git](https://git-scm.com/) e o [Docker Desktop](https://www.docker.com/products/docker-desktop/).
2. Abra o Docker Desktop e espere ele mostrar "Engine running".
3. Num terminal (no Windows, o Git Bash ou o PowerShell):

   ```bash
   git clone https://github.com/anderalex93/Sistema-de-Gestao-e-Reserva-de-Recursos-Academicos.git
   cd Sistema-de-Gestao-e-Reserva-de-Recursos-Academicos
   docker compose up --build
   ```

4. A primeira vez leva alguns minutos. Quando aparecer `Uvicorn running`, abra
   <http://localhost:8080>.
5. Entre com uma das contas da tabela [Contas para entrar](#contas-para-entrar).

Para parar: `Ctrl+C` no terminal. Para apagar também os dados e começar do zero:
`docker compose down -v`.

### Caminho B: `make run`

1. Instale, além do Git e do Docker Desktop:
   - [Python 3.13](https://www.python.org/downloads/) e o [uv](https://docs.astral.sh/uv/getting-started/installation/) (`pip install uv`);
   - [Node.js 24](https://nodejs.org/);
   - `make`. No Windows, use o terminal **Git Bash** (vem com o Git) e instale o make com
     `choco install make` ou `winget install GnuWin32.Make`. No macOS e no Linux ele já vem
     instalado.
2. Abra o Docker Desktop e espere ele mostrar "Engine running".
3. No terminal, na pasta do projeto:

   ```bash
   make run
   ```

4. Quando aparecerem `Uvicorn running` e `VITE ... ready`, abra <http://localhost:5173>. A
   documentação da API fica em <http://localhost:8000/docs>.

O `make run` faz tudo sozinho, e pode ser rodado de novo quantas vezes quiser:

1. cria o `backend/.env` no primeiro uso, com um segredo aleatório e as senhas locais;
2. instala as dependências do back e do front quando faltam;
3. sobe o PostgreSQL no Docker (porta 5433), aplica as migrações e cadastra o catálogo do campus
   e o administrador;
4. roda a API e o front juntos. Ao salvar um arquivo, a tela se atualiza sozinha.

Para parar: `Ctrl+C`. O banco continua rodando no Docker com os dados; `make stop` desliga.

`make run DEMO=1` também cria as contas e reservas da apresentação (Lucas, Marina e um mês de
histórico). `make help` lista os outros atalhos.

### Contas para entrar

| Caminho | E-mail | Senha | Perfil |
|---|---|---|---|
| A e B | `admin@umj.edu.br` | `Eduspace2026` | Administração |
| A, e B com `DEMO=1` | `aluno.demo@umj.edu.br` | `Demo2026` | Aluno (Lucas Andrade) |
| A, e B com `DEMO=1` | `prof.demo@umj.edu.br` | `Demo2026` | Professora (Marina Lopes) |
| A, e B com `DEMO=1` | `admin.demo@umj.edu.br` | `Demo2026` | Administração |

Também dá para criar a própria conta de aluno na tela de cadastro. As senhas acima valem só na
máquina local. No caminho B, se o `backend/.env` já existia, valem as senhas que estão nele.

### Se algo der errado

| Mensagem | O que fazer |
|---|---|
| `Cannot connect to the Docker daemon` ou `error during connect` | Abra o Docker Desktop e espere "Engine running" |
| `Port 5433 is already in use`, `8000` ou `5173` | Outro programa usa a porta. Feche-o, ou pare um `make run` antigo com `Ctrl+C` |
| `make: command not found` | No Windows, use o Git Bash e instale o make (passo 1 do caminho B) |
| `uv: command not found` | `pip install uv`; o Makefile encontra o uv instalado pelo pip mesmo fora do PATH |
| A tela abre, mas o login diz que o servidor não responde | A API ainda está subindo; espere `Uvicorn running` e tente de novo |

### Produção

A publicação (Neon, Render e Vercel) está versionada na
[#19](https://github.com/anderalex93/Sistema-de-Gestao-e-Reserva-de-Recursos-Academicos/issues/19),
com o passo a passo em [docs/deploy.md](docs/deploy.md).

## Desenvolvimento

Comandos de cada lado, para quem prefere rodar separado: [backend/README.md](backend/README.md)
e [frontend/README.md](frontend/README.md).

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
configuráveis (#28), quadro de horários (#51), LGPD (#34), as páginas públicas (#47, #48), o
check-in pelo QR da porta (#43) e o painel de ocupação (#44). A
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
| [Manual do usuário](docs/manual-do-usuario.md) | Como reservar, fazer check-in, conferir e cancelar; telas da administração |
| [Apresentação](docs/apresentacao/roteiro.md) | Roteiro da demo, contas, preparação e plano B |
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
