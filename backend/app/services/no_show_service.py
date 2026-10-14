from app.core.clock import Clock
from app.core.reservation_rules import ReservationRules
from app.db.unit_of_work import UnitOfWork
from app.repositories.reservation_repository import ReservationRepository


class NoShowService:
    """Liberação automática por não comparecimento (#43).

    Reserva confirmada sem check-in até `inicio + tolerância` vira `NAO_COMPARECEU` e deixa de
    ocupar o horário, que volta a aparecer livre e pode ser reservado de novo.

    A liberação é preguiçosa: não há worker (o plano gratuito do Render não tem), então ela roda
    como dependência de toda rota que lê ou grava ocupação (disponibilidade, busca, quadro,
    reservas e agenda da administração) e acontece na primeira leitura depois do prazo. Como o
    front consulta a grade a cada 10 s, na prática a sala aparece livre segundos após o prazo.
    """

    def __init__(
        self,
        *,
        reservations: ReservationRepository,
        uow: UnitOfWork,
        clock: Clock,
        rules: ReservationRules,
    ) -> None:
        self._reservations = reservations
        self._uow = uow
        self._clock = clock
        self._rules = rules

    def release_expired(self) -> int:
        """Libera de uma vez todas as reservas vencidas. Tolerância zero desliga."""
        if not self._rules.checkin_required:
            return 0
        now = self._clock.now()
        released = self._reservations.release_no_shows(now - self._rules.checkin_tolerance, now)
        if released:
            self._uow.commit()
        return released
