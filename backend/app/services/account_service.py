import secrets

from app.core.clock import Clock
from app.core.enums import UserRole
from app.core.exceptions import BusinessRuleError
from app.core.security import PasswordHasher
from app.db.unit_of_work import UnitOfWork
from app.models.user import User
from app.repositories.reservation_repository import ReservationRepository
from app.schemas.account import MyDataExport, ReservationExportRead
from app.schemas.user import UserRead
from app.services.future_reservation_canceller import FutureReservationCanceller

DELETION_REASON = "Conta excluída a pedido do titular."
DELETED_NAME = "Conta excluída"


class WrongPasswordError(BusinessRuleError):
    code = "SENHA_INCORRETA"
    default_detail = "Senha incorreta. Confira e tente de novo."


class AdminSelfDeletionError(BusinessRuleError):
    code = "OPERACAO_NAO_PERMITIDA"
    default_detail = (
        "Contas de administrador não podem ser excluídas por aqui. "
        "Peça para outro administrador mudar o seu perfil antes."
    )


class AccountService:
    """O que a própria pessoa faz com os dados dela (LGPD, #34): aceitar os termos, exportar
    tudo e excluir a conta."""

    def __init__(
        self,
        *,
        reservations: ReservationRepository,
        canceller: FutureReservationCanceller,
        hasher: PasswordHasher,
        clock: Clock,
        uow: UnitOfWork,
    ) -> None:
        self._reservations = reservations
        self._canceller = canceller
        self._hasher = hasher
        self._clock = clock
        self._uow = uow

    def accept_terms(self, user: User) -> User:
        """Conta criada pelo admin aceita no primeiro acesso. Aceitar de novo mantém a data
        original, que é a prova do consentimento."""
        if user.aceite_termos_em is None:
            user.aceite_termos_em = self._clock.now()
            self._uow.commit()
        return user

    def export(self, user: User) -> MyDataExport:
        return MyDataExport(
            gerado_em=self._clock.now(),
            conta=UserRead.model_validate(user),
            reservas=[
                ReservationExportRead(
                    codigo=reservation.codigo,
                    status=reservation.status,
                    recurso=reservation.recurso.nome,
                    bloco=reservation.recurso.bloco.nome,
                    inicio=reservation.inicio,
                    fim=reservation.fim,
                    finalidade=reservation.finalidade,
                    qtd_participantes=reservation.qtd_participantes,
                    criado_em=reservation.criado_em,
                    cancelada_em=reservation.cancelada_em,
                    motivo_cancelamento=reservation.motivo_cancelamento,
                )
                for reservation in self._reservations.all_for_user(user.id)
            ],
        )

    def delete(self, user: User, password: str) -> None:
        """Eliminação a pedido do titular (Art. 18, VI). A conta é anonimizada, não apagada: as
        reservas continuam no histórico do espaço sem identificar ninguém (Art. 16, IV), e as que
        ainda não começaram são canceladas para liberar os horários."""
        if user.perfil is UserRole.ADMIN:
            raise AdminSelfDeletionError
        if not self._hasher.verify(password, user.senha_hash):
            raise WrongPasswordError
        self._canceller.release_user(user, by=user, reason=DELETION_REASON)
        user.nome = DELETED_NAME
        user.email = f"excluida-{user.id}@eduspace.invalid"
        user.matricula = None
        # Senha aleatória descartada: ninguém mais entra nesta conta.
        user.senha_hash = self._hasher.hash(secrets.token_urlsafe(32))
        user.ativo = False
        self._uow.commit()
