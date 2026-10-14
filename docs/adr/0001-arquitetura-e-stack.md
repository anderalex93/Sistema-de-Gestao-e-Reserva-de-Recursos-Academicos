# ADR 0001 — Arquitetura, stack e convenções do EduSpace

- **Status:** Aceito
- **Data:** 13/10/2026
- **Decisores:** Anderson Alex (PO), José Amaral (SM), Ramon Albuquerque (Dev Full Stack)
- **Issue:** #8

## Contexto

O EduSpace é uma plataforma web responsiva de reserva de salas de estudo, laboratórios e
equipamentos do campus da UMJ (relatório da Sprint 1). O MVP precisa estar **funcionando e
publicado** para a apresentação de **20/11/2026**, com cerca de cinco semanas de desenvolvimento.

Requisitos que mais pesam na arquitetura:

| Requisito | Impacto na decisão |
|---|---|
| RF01 — autenticação por e-mail institucional | Autenticação própria com validação de domínio configurável |
| RF03 — reservas em tempo real | Disponibilidade sempre atualizada no cliente |
| RNF01 — responsivo mobile/desktop | Biblioteca de UI com componentes responsivos e acessíveis |
| RNF02 — consultas de disponibilidade ≤ 2 s | Banco relacional com índices adequados, sem N+1 |
| RNF03 — nunca permitir reservas sobrepostas | Garantia **no banco**, à prova de requisições simultâneas |

Além dos requisitos, a equipe quer um código **organizado, orientado a objetos e fortemente
tipado**: cada responsabilidade numa classe com contrato explícito, erros de tipo pegos antes de
rodar, e o contrato entre back e front verificado pelo compilador.

Restrições: a disciplina exige **backend em Python** e **frontend em React**; equipe pequena;
hospedagem gratuita.

## Decisão

### 1. Stack

| Camada | Escolha |
|---|---|
| Linguagem do back | Python 3.13 |
| Framework web | FastAPI + Pydantic v2 (OpenAPI/Swagger automático em `/docs`) |
| ORM e migrações | SQLAlchemy 2.x (mapeamento tipado com `Mapped[...]`) + Alembic |
| Banco | PostgreSQL 16 (extensão `btree_gist`) |
| Dependências do back | `uv` com `pyproject.toml` + `uv.lock` |
| Tipagem do back | **mypy `--strict`** com plugin do Pydantic |
| Autenticação | JWT (PyJWT, HS256) + hash de senha argon2 (`pwdlib[argon2]`) |
| Rate limit | `slowapi` em login e cadastro |
| Testes do back | pytest + `TestClient` (httpx2) contra **PostgreSQL real** |
| Lint/format do back | ruff |
| Front | React 19 + TypeScript (`strict` + `noUncheckedIndexedAccess`) + Vite |
| Tipos da API no front | **`openapi-typescript`**, gerados a partir do OpenAPI do backend |
| UI | MUI + `@mui/x-date-pickers` + dayjs (locale `pt-br`, plugin `timezone`) |
| Dados no front | TanStack Query + `fetch` nativo (axios removido na #32, por peso) |
| Formulários | react-hook-form + zod (tipos inferidos com `z.infer`) |
| Roteamento | React Router |
| Testes do front | Vitest + Testing Library + MSW; Playwright no E2E |
| Ambiente local | Docker Compose apenas para o PostgreSQL; back e front rodam nativos (hot reload) |
| CI | GitHub Actions |
| Hospedagem | API no Render, banco no Neon, front na Vercel |

### 2. Estrutura do monorepo

```
.
├── backend/
│   ├── app/
│   │   ├── main.py                # cria a app: CORS, handlers de erro, rate limit, routers
│   │   ├── api/
│   │   │   ├── dependencies.py    # providers de sessão, repositórios, services e usuário atual
│   │   │   └── v1/
│   │   │       ├── router.py      # agrega os routers da v1
│   │   │       └── endpoints/     # auth.py, resources.py, reservations.py, admin/…
│   │   ├── core/
│   │   │   ├── config.py          # Settings (pydantic-settings)
│   │   │   ├── enums.py           # StrEnum do domínio
│   │   │   ├── exceptions.py      # hierarquia de exceções de domínio
│   │   │   ├── security.py        # PasswordHasher, TokenService
│   │   │   └── logging.py
│   │   ├── db/                    # Base declarativa, mixins e sessão
│   │   ├── models/                # entidades ORM (uma classe por arquivo)
│   │   ├── schemas/               # DTOs Pydantic de entrada e saída
│   │   ├── repositories/          # BaseRepository[ModelT] + um repositório por entidade
│   │   ├── services/              # regras de negócio (uma classe por caso de uso/domínio)
│   │   ├── cli.py                 # comandos administrativos (ex.: criar-admin)
│   │   └── seed.py                # dados de demonstração
│   ├── alembic/
│   ├── tests/                     # conftest.py, api/, services/, repositories/, load/
│   ├── Makefile
│   ├── pyproject.toml
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/  layouts/  components/  contexts/  hooks/
│   │   ├── lib/api/
│   │   │   ├── schema.d.ts        # GERADO pelo openapi-typescript — não editar à mão
│   │   │   ├── types.ts           # aliases legíveis sobre o schema gerado
│   │   │   ├── http-client.ts     # classe HttpClient (fetch, token, ApiError)
│   │   │   └── *.api.ts           # uma classe por domínio (ReservationApi, ResourceApi…)
│   │   ├── domain/                # enums, labels e regras puras de apresentação
│   │   ├── schemas/forms/         # schemas zod
│   │   ├── router/                # rotas e guards
│   │   ├── theme/  test/
│   │   ├── config.ts              # API_URL e demais configs a partir de import.meta.env
│   │   └── main.tsx
│   ├── e2e/
│   ├── package.json
│   └── .env.example
├── docs/                          # adr/, modelagem/, design/, sprints/, qualidade/
├── docker-compose.yml
└── .github/workflows/
```

### 3. Camadas do backend (orientadas a objetos)

Fluxo de dependência: **Endpoint → Service → Repository → Model**. Cada camada só conhece a de
baixo, e todas as dependências entram pelo **construtor** (injeção de dependência). Os
endpoints recebem os services já montados via `Depends`.

| Camada | Forma | Responsabilidade | Não pode conter |
|---|---|---|---|
| `api/v1/endpoints` | funções finas | Auth, parsing de entrada, chamada ao service | Regra de negócio, SQL, `try/except` de domínio |
| `services` | **classes** | Regras de negócio e orquestração | Query SQL, `HTTPException` |
| `repositories` | **classes** (herdam de `BaseRepository[ModelT]`) | Acesso a dados | Regra de negócio, `HTTPException` |
| `schemas` | classes Pydantic | Contratos de entrada/saída (DTOs) e validações de formato | Persistência |
| `models` | classes ORM | Mapeamento das tabelas | Lógica de aplicação |
| `core/exceptions` | hierarquia de classes | Erros de domínio com `code` e status HTTP | — |

Exemplo do padrão (ilustrativo):

```python
# core/enums.py
class ReservationStatus(StrEnum):
    CONFIRMADA = "CONFIRMADA"
    CANCELADA = "CANCELADA"

# core/exceptions.py
class DomainError(Exception):
    status_code: ClassVar[int] = 400
    code: ClassVar[str] = "ERRO_DE_DOMINIO"

    def __init__(self, detail: str) -> None:
        super().__init__(detail)
        self.detail = detail

class ConflictError(DomainError):
    status_code = 409

class ReservationConflictError(ConflictError):
    code = "RESERVA_CONFLITO"

# repositories/base.py
class BaseRepository(Generic[ModelT]):
    model: type[ModelT]

    def __init__(self, session: Session) -> None:
        self.session = session

    def get(self, entity_id: int) -> ModelT | None:
        return self.session.get(self.model, entity_id)

    def add(self, entity: ModelT) -> ModelT:
        self.session.add(entity)
        self.session.flush()
        return entity

# repositories/reservation_repository.py
class ReservationRepository(BaseRepository[Reservation]):
    model = Reservation

    def has_overlap(self, recurso_id: int, inicio: datetime, fim: datetime) -> bool: ...

# services/reservation_service.py
class ReservationService:
    def __init__(self, reservations: ReservationRepository, resources: ResourceRepository) -> None:
        self._reservations = reservations
        self._resources = resources

    def create(self, user: User, data: ReservationCreate) -> Reservation: ...
```

Um único *exception handler* em `main.py` converte qualquer `DomainError` em
`{ "detail": ..., "code": ... }` com o `status_code` da classe. Assim os services lançam erros
de domínio sem conhecer HTTP, e os endpoints ficam sem `try/except`.

**Diretrizes de POO**
- Composição antes de herança. Herança só onde há um contrato comum real
  (`BaseRepository`, `DomainError`, mixins de model como `TimestampMixin`).
- Uma classe por arquivo em `models/`, `repositories/` e `services/`, com nome igual ao arquivo
  (`reservation_service.py` → `ReservationService`).
- Atributos internos com `_` (encapsulamento); a API pública da classe são os métodos.
- Quando um service precisar de algo externo e trocável (relógio, envio de e-mail), declarar um
  `Protocol` e injetar. O relógio é `Clock`, para os testes controlarem "agora" (regra dos
  30 minutos do RF04).

### 4. Tipagem

**Backend**
- `mypy --strict` faz parte do gate e do CI: nenhuma função sem anotação e nenhum `Any` implícito.
- Models com `Mapped[...]`/`mapped_column`; enums de domínio como `StrEnum`, mapeados no banco.
- Services e repositories recebem e devolvem **tipos concretos** (models ou DTOs), nunca `dict`.
- DTOs Pydantic separados por intenção: `ReservationCreate` (entrada), `ReservationRead`
  (saída), `ReservationUpdate`, com `model_config = ConfigDict(from_attributes=True)` na saída.
- `Page[T]` genérico para o envelope de paginação.
- `# type: ignore` só com código de erro e comentário justificando.

**Frontend**
- `tsconfig` com `strict` e `noUncheckedIndexedAccess`; `any` proibido pelo linter
  (oxlint, `typescript/no-explicit-any`).
- **Contrato gerado, não escrito à mão:** `npm run gen:api` roda o `openapi-typescript` sobre
  o `/openapi.json` do backend e gera `src/lib/api/schema.d.ts`. Se o back mudar um campo, o
  front deixa de compilar no lugar exato que precisa ser ajustado.
- `src/lib/api/types.ts` expõe aliases legíveis
  (`export type Reservation = components["schemas"]["ReservationRead"]`).
- Classe `HttpClient` encapsula o `fetch`, token e conversão de erros em `ApiError`. Cada domínio
  tem sua classe (`ReservationApi`, `ResourceApi`, `AuthApi`) recebendo o `HttpClient` no
  construtor, com instâncias únicas exportadas.
- Componentes e hooks continuam **funcionais**, que é o padrão idiomático do React. A orientação
  a objetos fica na camada de acesso a dados e no domínio.
- Tipos de formulário inferidos do zod (`type SignupForm = z.infer<typeof signupSchema>`).

### 5. Camadas do frontend

**Page → Layout → Component.** Páginas orquestram dados e estado; layouts só estruturam;
componentes são apresentacionais, com props tipadas e sem chamadas de rede. Toda chamada HTTP
passa pelas classes de `src/lib/api/`, consumidas por hooks do TanStack Query em `src/hooks/`.
Estado global de cliente só em `contexts` (ex.: `AuthContext`).

### 6. Nomenclatura e idioma

| O quê | Padrão | Exemplo |
|---|---|---|
| Tabelas e colunas | pt-BR, `snake_case`, singular | `reserva`, `recurso_id`, `criado_em` |
| Campos JSON da API | idênticos às colunas | `{ "recurso_id": 3, "inicio": "…" }` |
| Enums de domínio (valores) | pt-BR, MAIÚSCULAS | `CONFIRMADA`, `SALA_ESTUDO`, `ADMIN` |
| Códigos de erro | pt-BR, MAIÚSCULAS | `RESERVA_CONFLITO` |
| Rotas da API | pt-BR, plural, sob `/api/v1` | `/api/v1/reservas`, `/api/v1/recursos/{id}/disponibilidade` |
| Classes, métodos, funções, variáveis, módulos (Python e TS) | inglês | `ReservationService.create`, `useReservations` |
| Textos de interface e mensagens de erro | pt-BR | "Este horário acabou de ser reservado" |
| Commits | inglês, Conventional Commits | `feat(reservations): block overlapping bookings` |

Atributos de models e schemas espelham as colunas (pt-BR). Os tipos do front vêm do OpenAPI,
então os campos chegam exatamente como o backend envia, sem conversão para camelCase.

### 7. Contrato da API

- **Versionamento:** prefixo `/api/v1`.
- **Erro de domínio:** `{ "detail": "mensagem amigável", "code": "CODIGO_DO_ERRO" }` com o
  status HTTP da classe de exceção (400, 401, 403, 404, 409, 422). Erros de validação do
  Pydantic mantêm o formato padrão do FastAPI (`detail` como lista com `loc`), que o front usa
  para marcar campos. Nunca retornar stack trace.
- **Paginação** (toda listagem): `Page[T]` = `{ "items": [], "total": 0, "page": 1, "per_page": 20, "total_pages": 0 }`.
  `per_page` padrão 20, máximo 100. O front sempre lê `.items`.
- **Datas:** ISO 8601 com offset. Banco em `timestamptz` (UTC). O front exibe em
  `America/Maceio`. Horários de reserva em blocos de 30 minutos.
- Todo endpoint declara `response_model` e os `responses` de erro, para o OpenAPI (e os tipos
  gerados no front) ficarem completos.

### 8. Integridade das reservas (RNF03)

A regra "nunca dois agendamentos no mesmo espaço e horário" é garantida pelo **PostgreSQL**,
não apenas pelo código:

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE reserva ADD CONSTRAINT reserva_sem_sobreposicao
  EXCLUDE USING gist (recurso_id WITH =, tstzrange(inicio, fim, '[)') WITH &&)
  WHERE (status = 'CONFIRMADA');
```

`ReservationService` faz uma verificação prévia (`has_overlap`) para dar resposta rápida, mas a
garantia real é a constraint: se duas requisições simultâneas passarem pela verificação, o banco
recusa a segunda, o repositório converte o `IntegrityError` em `ReservationConflictError` e a API
devolve `409 RESERVA_CONFLITO`. O intervalo `[)` permite reservas adjacentes (19:00–20:00 e
20:00–21:00). Reservas canceladas não bloqueiam horário.

### 9. Autenticação e sessão

- Contas nascem de dois jeitos: **autocadastro** (sempre perfil `ALUNO`) ou **criação pelo admin**
  (escolhe o perfil). O cadastro aceita qualquer e-mail; a restrição ao e-mail institucional existe,
  desligada, e liga preenchendo `ALLOWED_EMAIL_DOMAINS` (decisão da equipe em 13/10/2026).
- Login devolve um **access token JWT** (`sub` = id do usuário, `perfil`, `exp`) válido por
  **8 horas**. Sem refresh token no MVP: expirou, o usuário faz login de novo.
- No front, o token fica no `localStorage`, acessado **somente** pelo `HttpClient` e pelo
  `AuthContext`. Mitigações de XSS: renderização declarativa do React, nenhum
  `dangerouslySetInnerHTML`, expiração curta.
- Perfis (`UserRole`): `ALUNO` (padrão no cadastro), `PROFESSOR` e `ADMIN`. O primeiro admin é
  criado pelo seed (`make seed`, com `SEED_ADMIN_*` no `.env`), sem endpoint público.
- Rate limit com `slowapi`: login 5/min por IP, cadastro 3/min por IP.
- Logs nunca contêm senha, token ou e-mail completo.

### 10. "Tempo real" (RF03)

TanStack Query com `refetchInterval` de 10–15 s nas telas de disponibilidade e busca (só com
a aba visível), `refetchOnWindowFocus` e invalidação imediata após criar ou cancelar. SSE fica
como evolução opcional.

### 11. Testes e qualidade

- **Back:** pytest contra um banco PostgreSQL de teste (Docker local e *service container*
  no CI), com migrações aplicadas via Alembic e rollback por teste. **SQLite está proibido**:
  não suporta a exclusion constraint e mascararia bugs de RNF03. Services testados com
  repositórios reais e `Clock` controlado.
- **Front:** testes co-localizados (`Foo.tsx` ↔ `Foo.test.tsx`) com Vitest, Testing Library e
  MSW; mocks de listagem usam o envelope paginado real.
- **E2E:** Playwright cobrindo o fluxo principal antes da apresentação.
- **Gates locais:**
  - backend `make ci`: `ruff check`, `ruff format --check`, `mypy --strict`, `pytest`
  - frontend `npm run ci`: `lint`, `typecheck`, `test`, `build`

### 12. Fluxo de trabalho

- Desenvolvimento **direto na `main`** (trunk-based): `git pull`, commit, `git push`.
  Sem pull requests nem aprovação obrigatória — o desenvolvimento é feito por um único
  integrante, e a validação acontece pelos gates locais, pelo CI e pela Sprint Review.
- Commits pequenos e atômicos em Conventional Commits; o commit que conclui uma tarefa cita a
  issue (`closes #N`).
- Segredos só em variáveis de ambiente; `.env` nunca é versionado (há `.env.example`).
- Deploy automático a cada push na `main`.

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| Django + DRF | Mais pesado para uma API pequena; FastAPI dá OpenAPI e validação com menos código |
| SQLite | Sem exclusion constraint e com concorrência limitada — não atende RNF03 |
| Checar sobreposição só no código | Condição de corrida: duas requisições simultâneas passariam |
| Camada de acesso a dados com funções soltas (`crud/`) | Sem contrato comum nem injeção de dependência; repositórios em classe com `BaseRepository[ModelT]` reaproveitam o CRUD genérico com tipagem |
| Lançar `HTTPException` nos services | Acopla regra de negócio a HTTP; exceções de domínio mantêm os services testáveis e reutilizáveis (CLI, seed) |
| Tipos da API escritos à mão no front | Divergem do back silenciosamente; gerar do OpenAPI faz o compilador apontar a quebra |
| Componentes React em classe | Não são mais o padrão do React; hooks e componentes funcionais são o idioma atual |
| Next.js | SSR desnecessário para um painel autenticado; deploy e mental model mais complexos |
| Redux / Zustand para dados da API | TanStack Query já resolve cache, refetch e invalidação |
| Tailwind + shadcn/ui | Mais trabalho para montar date picker, dialog e tabelas acessíveis |
| Token em cookie httpOnly | Front (vercel.app) e API (onrender.com) são sites diferentes; cookies de terceiros são bloqueados por vários navegadores e o setup de CORS/CSRF consumiria tempo do MVP |
| WebSocket para tempo real | Infra e testes mais complexos; polling atende o volume de uso esperado |

## Consequências

**Positivas**
- RNF03 garantido pelo banco, demonstrável em teste de concorrência e ao vivo.
- Contrato back↔front verificado pelo compilador (OpenAPI → TypeScript).
- `mypy --strict` e TypeScript estrito pegam erros antes de rodar.
- Classes com dependências no construtor tornam cada regra testável isoladamente.
- Swagger automático serve de documentação da API para o front e para a banca.
- Ambiente local sobe com `docker compose up -d` + um comando por app.

**Negativas / riscos aceitos**
- Mais código de estrutura (repositórios, DTOs, exceções) do que uma API "rápida e solta";
  aceito em troca de organização e tipagem.
- `mypy --strict` exige anotar tudo e às vezes brigar com stubs de bibliotecas.
- Os tipos do front precisam ser regenerados (`npm run gen:api`) sempre que o contrato muda.
- Token no `localStorage` é mais exposto a XSS que cookie httpOnly. Evolução: servir a API
  pelo mesmo domínio do front (rewrite da Vercel) e migrar para cookie httpOnly + proteção CSRF.
- Sem refresh token, o usuário precisa logar de novo a cada 8 horas.
- Plano gratuito do Render "dorme" após inatividade (primeiro acesso ~50 s): a API deve ser
  acordada antes da apresentação.
- Polling gera requisições periódicas; aceitável na escala de um campus.
- Desenvolvimento sem PR depende dos gates locais e do CI para pegar regressões.
