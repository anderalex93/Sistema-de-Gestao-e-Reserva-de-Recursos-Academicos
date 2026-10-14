from fastapi import APIRouter, Request

from app.api.dependencies import AuthServiceDep, CurrentUserDep, UserServiceDep
from app.core.rate_limit import LOGIN_LIMIT, SIGNUP_LIMIT, limiter
from app.models.user import User
from app.schemas.auth import LoginRequest, TokenRead
from app.schemas.errors import TOO_MANY_ATTEMPTS, UNAUTHORIZED, ErrorResponse
from app.schemas.user import UserRead, UserSignup

router = APIRouter(prefix="/auth", tags=["Autenticação"])


@router.post(
    "/cadastro",
    status_code=201,
    summary="Cria a própria conta (perfil Aluno)",
    description=(
        "O perfil é sempre `ALUNO`; professor e administrador são criados pela administração. "
        "Quando o servidor restringe domínios, o e-mail precisa ser institucional (ex.: "
        "`@umj.edu.br`). O aceite do Aviso de Privacidade e dos Termos de Uso "
        "(`aceite_termos: true`) é obrigatório e fica registrado com data. Senha com 8 a 128 "
        "caracteres, com letras e números; matrícula opcional. Limite de 10 cadastros por "
        "minuto por IP."
    ),
    response_model=UserRead,
    responses={
        409: {
            "model": ErrorResponse,
            "description": (
                "E-mail (`EMAIL_JA_CADASTRADO`) ou matrícula (`MATRICULA_JA_CADASTRADA`) já "
                "cadastrados"
            ),
        },
        422: {
            "model": ErrorResponse,
            "description": (
                "E-mail fora do domínio institucional (`DOMINIO_NAO_PERMITIDO`). Campos "
                "inválidos, como aceite ausente ou senha fraca, voltam no formato de validação "
                "do FastAPI, com `detail` em lista"
            ),
        },
        **TOO_MANY_ATTEMPTS,
    },
)
@limiter.limit(SIGNUP_LIMIT)
def signup(request: Request, data: UserSignup, service: UserServiceDep) -> User:  # noqa: ARG001
    return service.register(data)


@router.post(
    "/login",
    summary="Entra com e-mail e senha e recebe o token de acesso",
    description=(
        "Devolve um token Bearer (JWT) válido por `expires_in` segundos e os dados da conta. "
        "Envie-o no cabeçalho `Authorization: Bearer <token>`. E-mail inexistente e senha "
        "errada dão a mesma resposta. Limite de 20 tentativas por minuto por IP."
    ),
    response_model=TokenRead,
    responses={
        401: {
            "model": ErrorResponse,
            "description": "E-mail ou senha incorretos (`CREDENCIAIS_INVALIDAS`)",
        },
        403: {"model": ErrorResponse, "description": "Conta desativada (`USUARIO_INATIVO`)"},
        **TOO_MANY_ATTEMPTS,
    },
)
@limiter.limit(LOGIN_LIMIT)
def login(request: Request, data: LoginRequest, service: AuthServiceDep) -> TokenRead:  # noqa: ARG001
    return service.login(data)


@router.get(
    "/me",
    summary="Dados de quem está logado",
    description=(
        "Usado para restaurar a sessão. `aceite_termos_em` vazio indica conta criada pelo "
        "administrador que ainda precisa aceitar os termos."
    ),
    response_model=UserRead,
    responses=UNAUTHORIZED,
)
def me(user: CurrentUserDep) -> User:
    return user
