from app.core.clock import Clock
from app.core.enums import ReservationStatus, UserRole
from app.core.exceptions import BusinessRuleError, NotFoundError
from app.db.unit_of_work import UnitOfWork
from app.models.user import User
from app.repositories.reservation_repository import ReservationRepository
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserAdminUpdate

DEACTIVATION_REASON = "Conta desativada pela administração."


class UserNotFoundError(NotFoundError):
    default_detail = "Usuário não encontrado."


class SelfLockoutError(BusinessRuleError):
    code = "OPERACAO_NAO_PERMITIDA"
    default_detail = (
        "Você não pode tirar o seu próprio acesso de administrador nem desativar a sua conta. "
        "Peça para outro administrador fazer isso."
    )


class UserAdminService:
    """Perfil e situação de contas existentes (#50). Nada é apagado: a conta é desativada."""

    def __init__(
        self,
        *,
        users: UserRepository,
        reservations: ReservationRepository,
        clock: Clock,
        uow: UnitOfWork,
    ) -> None:
        self._users = users
        self._reservations = reservations
        self._clock = clock
        self._uow = uow

    def update(self, user_id: int, data: UserAdminUpdate, admin: User) -> User:
        """O perfil vale a partir da próxima requisição, porque cada requisição relê a conta.
        Desativar derruba a sessão na hora e cancela as reservas que ainda não começaram,
        para que quem saiu da instituição não continue prendendo horários."""
        user = self._users.get(user_id)
        if user is None:
            raise UserNotFoundError
        if user.id == admin.id and (
            (data.perfil is not None and data.perfil is not UserRole.ADMIN) or data.ativo is False
        ):
            raise SelfLockoutError
        if data.perfil is not None:
            user.perfil = data.perfil
        if data.ativo is not None:
            if user.ativo and not data.ativo:
                self._cancel_future_reservations(user, admin)
            user.ativo = data.ativo
        self._uow.commit()
        return user

    def _cancel_future_reservations(self, user: User, admin: User) -> None:
        now = self._clock.now()
        for reservation in self._reservations.confirmed_starting_after_for_user(user.id, now):
            reservation.status = ReservationStatus.CANCELADA
            reservation.cancelada_em = now
            reservation.cancelada_por_id = admin.id
            reservation.motivo_cancelamento = DEACTIVATION_REASON
