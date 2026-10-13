from datetime import datetime

from sqlalchemy import ColumnElement, and_, func

from app.core.enums import ReservationStatus
from app.models.reservation import Reservation


def overlaps_confirmed(inicio: datetime, fim: datetime) -> ColumnElement[bool]:
    """Reserva confirmada que toca `[inicio, fim)`.

    Escrito com o mesmo predicado da exclusion constraint (`tstzrange(inicio, fim, '[)') &&` e
    `status = 'CONFIRMADA'`) para o Postgres usar o índice GiST dela, que encontra a sobreposição
    exata em vez de ler todo o histórico do recurso (#33). Encostar no início ou no fim não é
    sobreposição, como na constraint.
    """
    return and_(
        Reservation.status == ReservationStatus.CONFIRMADA,
        func.tstzrange(Reservation.inicio, Reservation.fim, "[)").bool_op("&&")(
            func.tstzrange(inicio, fim, "[)")
        ),
    )
