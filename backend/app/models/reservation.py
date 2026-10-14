from datetime import datetime

from sqlalchemy import BigInteger, CheckConstraint, ForeignKey, Index, SmallInteger, String, text
from sqlalchemy.dialects.postgresql import ExcludeConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.enums import ReservationStatus
from app.db.base import Base, IdMixin, TimestampMixin
from app.db.types import str_enum
from app.models.resource import Resource
from app.models.user import User


class Reservation(IdMixin, TimestampMixin, Base):
    """Ocupação de um recurso por um usuário num intervalo `[inicio, fim)`.

    O banco garante o RNF03: duas reservas confirmadas do mesmo recurso nunca se sobrepõem.
    Canceladas e `NAO_COMPARECEU` (#43) não ocupam o horário. Quem encerra o uso mais cedo
    encurta `fim` e guarda o original em `fim_previsto`; o resto do horário fica livre.
    Regras que dependem de configuração (múltiplo de 30 min, funcionamento) ficam no service.
    """

    __tablename__ = "reserva"
    __table_args__ = (
        CheckConstraint("fim > inicio", name="fim_depois_do_inicio"),
        CheckConstraint(
            "(status = 'CANCELADA') = (cancelada_em IS NOT NULL)", name="cancelamento_coerente"
        ),
        CheckConstraint(
            "(status = 'NAO_COMPARECEU') = (liberada_em IS NOT NULL)", name="liberacao_coerente"
        ),
        CheckConstraint(
            "fim_previsto IS NULL OR (encerrada_em IS NOT NULL AND fim_previsto > fim)",
            name="encerramento_coerente",
        ),
        CheckConstraint("qtd_participantes > 0", name="participantes_positivo"),
        ExcludeConstraint(
            ("recurso_id", "="),
            (text("tstzrange(inicio, fim, '[)')"), "&&"),
            name="reserva_sem_sobreposicao",
            using="gist",
            where="status = 'CONFIRMADA'",
        ),
        Index("ix_reserva_usuario_id_inicio", "usuario_id", "inicio"),
        # Disponibilidade, quadro e agenda filtram por recurso e janela de horário.
        Index("ix_reserva_recurso_id_inicio", "recurso_id", "inicio"),
        Index("ix_reserva_inicio", "inicio"),
        # Liberação por não comparecimento (#43): só as confirmadas ainda sem check-in.
        Index(
            "ix_reserva_inicio_sem_checkin",
            "inicio",
            postgresql_where=text("status = 'CONFIRMADA' AND checkin_em IS NULL"),
        ),
    )

    codigo: Mapped[str] = mapped_column(String(10), unique=True)
    recurso_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("recurso.id", ondelete="RESTRICT")
    )
    usuario_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("usuario.id", ondelete="RESTRICT")
    )
    inicio: Mapped[datetime]
    fim: Mapped[datetime]
    status: Mapped[ReservationStatus] = mapped_column(
        str_enum(ReservationStatus, name="status"),
        default=ReservationStatus.CONFIRMADA,
        server_default=ReservationStatus.CONFIRMADA,
    )
    finalidade: Mapped[str | None] = mapped_column(String(200))
    qtd_participantes: Mapped[int | None] = mapped_column(SmallInteger)
    cancelada_em: Mapped[datetime | None]
    cancelada_por_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("usuario.id", ondelete="RESTRICT")
    )
    motivo_cancelamento: Mapped[str | None] = mapped_column(String(300))
    # Presença confirmada pelo QR Code do espaço (#43).
    checkin_em: Mapped[datetime | None]
    # Quando virou NAO_COMPARECEU e o horário voltou a ficar livre.
    liberada_em: Mapped[datetime | None]
    # Quando quem reservou encerrou o uso antes do fim.
    encerrada_em: Mapped[datetime | None]
    # O fim original, só quando o encerramento antecipado encurtou a reserva.
    fim_previsto: Mapped[datetime | None]

    recurso: Mapped[Resource] = relationship(lazy="joined", innerjoin=True)
    usuario: Mapped[User] = relationship(foreign_keys=[usuario_id])
