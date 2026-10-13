"""Hierarquia de erros de domínio.

Services e repositórios lançam estas exceções sem conhecer HTTP. O handler registrado em
`app.main` converte cada uma em `{"detail": ..., "code": ...}` com o `status_code` da classe.
"""

from types import MappingProxyType
from typing import ClassVar


class DomainError(Exception):
    status_code: ClassVar[int] = 400
    code: ClassVar[str] = "ERRO_DE_DOMINIO"
    default_detail: ClassVar[str] = "Não foi possível concluir a operação."
    headers: ClassVar[MappingProxyType[str, str]] = MappingProxyType({})

    def __init__(self, detail: str | None = None) -> None:
        self.detail = detail or self.default_detail
        super().__init__(self.detail)


class UnauthorizedError(DomainError):
    status_code = 401
    code = "NAO_AUTENTICADO"
    default_detail = "Faça login para continuar."
    headers = MappingProxyType({"WWW-Authenticate": "Bearer"})


class ForbiddenError(DomainError):
    status_code = 403
    code = "ACESSO_NEGADO"
    default_detail = "Você não tem permissão para esta ação."


class NotFoundError(DomainError):
    status_code = 404
    code = "NAO_ENCONTRADO"
    default_detail = "Registro não encontrado."


class ConflictError(DomainError):
    status_code = 409
    code = "CONFLITO"
    default_detail = "A operação conflita com o estado atual dos dados."


class BusinessRuleError(DomainError):
    status_code = 422
    code = "REGRA_DE_NEGOCIO"
    default_detail = "A operação não atende às regras do sistema."


class ServiceUnavailableError(DomainError):
    status_code = 503
    code = "SERVICO_INDISPONIVEL"
    default_detail = "Serviço temporariamente indisponível. Tente novamente em instantes."
