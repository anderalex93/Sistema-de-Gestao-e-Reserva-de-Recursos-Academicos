# EduSpace API

Backend do EduSpace em FastAPI. Decisões de arquitetura no
[ADR 0001](../docs/adr/0001-arquitetura-e-stack.md); modelo de dados em
[docs/modelagem/der.md](../docs/modelagem/der.md).

## Rodar em 6 passos

Pré-requisitos: Docker, Python 3.13, [uv](https://docs.astral.sh/uv/) e `make`
(no Windows, use o Git Bash).

```bash
cd backend
cp .env.example .env        # 1. configure JWT_SECRET (32+ caracteres) e SEED_ADMIN_SENHA
make install                # 2. instala as dependências
make db-up                  # 3. sobe o PostgreSQL na porta 5433
make migrate                # 4. aplica as migrações
make seed                   # 5. cria o administrador inicial
make dev                    # 6. API em http://localhost:8000
```

Confira em <http://localhost:8000/api/v1/health> (`{"status": "ok", "db": "ok"}`) e a
documentação interativa em <http://localhost:8000/docs>.

## Contas e acesso

| Como a conta nasce | Rota | Perfil |
|---|---|---|
| Seed do administrador inicial | `make seed` (lê `SEED_ADMIN_NOME`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_SENHA`) | `ADMIN` |
| Autocadastro | `POST /api/v1/auth/cadastro` | sempre `ALUNO` |
| Criada pelo admin | `POST /api/v1/admin/usuarios` | escolhido pelo admin |

- O seed é idempotente: rodar de novo não duplica a conta nem troca a senha; se o e-mail já
  existir como aluno ou desativado, ele é promovido a admin e reativado.
- Login em `POST /api/v1/auth/login` devolve um JWT de 8 horas; envie como
  `Authorization: Bearer <token>`. No Swagger, use o botão **Authorize**.
- O cadastro aceita qualquer e-mail. Para exigir o institucional, defina
  `ALLOWED_EMAIL_DOMAINS=umj.edu.br` (só vale para o autocadastro; o admin cria qualquer conta).
- Senhas: 8 a 128 caracteres, com letras e números, guardadas com argon2.
- Rate limit por IP: login 20/min, cadastro 10/min.

## Comandos

| Comando | O que faz |
|---|---|
| `make ci` | Gate completo: ruff, `mypy --strict` e pytest com cobertura mínima de 90% |
| `make test` | Só os testes, com relatório de cobertura |
| `make format` | Corrige lint e formata o código |
| `make seed` | Cria ou confere o administrador inicial |
| `make revision m="create reserva"` | Gera migração a partir dos models (revise o arquivo antes de commitar) |
| `make db-down` | Para o PostgreSQL mantendo os dados |

Os testes usam o banco `eduspace_test` (criado pelo Docker na primeira subida). A suíte apaga e
recria o schema desse banco a cada execução e se recusa a rodar se `TEST_DATABASE_URL` não
apontar para um banco terminado em `_test`.

## Estrutura

```
app/
  main.py                 create_app(): CORS, handlers de erro, routers, ciclo de vida
  api/
    dependencies.py       sessão por requisição e montagem de repositórios e services
    error_handlers.py     DomainError e erros HTTP viram {"detail", "code"}
    v1/endpoints/         um módulo por recurso da API
  core/                   config, enums, exceções de domínio, relógio, logging
  db/                     Base declarativa, mixins (id, timestamps) e sessão
  models/                 entidades ORM
  schemas/                DTOs Pydantic (entrada, saída, paginação, erro)
  repositories/           BaseRepository[ModelT] e repositórios por entidade
  services/               regras de negócio
alembic/                  migrações
tests/                    espelha app/; banco PostgreSQL real
```

## Como adicionar uma funcionalidade

1. **Model** em `app/models/` (herda `IdMixin`, `TimestampMixin`, `Base`) e importe em
   `app/models/__init__.py`.
2. **Migração** com `make revision m="..."`; revise constraints e índices.
3. **Repositório** herdando `BaseRepository[Model]`, com as consultas específicas.
4. **Service** em classe, recebendo repositórios no construtor. Erros de regra são subclasses de
   `DomainError` com `code` próprio. O service decide quando fazer `commit()`.
5. **Schemas** `XCreate`, `XRead`, `XUpdate`; listagens devolvem `Page[XRead]`.
6. **Endpoint** fino em `app/api/v1/endpoints/`, com `response_model` e `responses` de erro
   declarados; provider do service em `app/api/dependencies.py`.
7. **Testes** do caminho feliz, validação, 401/403 e casos de borda.
