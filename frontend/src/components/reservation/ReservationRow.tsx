import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { Link as RouterLink } from 'react-router';

import { CheckinNoteLine } from '@/components/reservation/CheckinNoteLine';
import { StatusLabel } from '@/components/reservation/StatusLabel';
import type { CheckinNote } from '@/domain/checkin';
import { displayStatus } from '@/domain/reservation-status';
import { locationLabel } from '@/domain/resource-types';
import { campusTime, campusToday, dayLabel } from '@/domain/schedule';
import type { MyReservationRead } from '@/lib/api/types';
import { paths } from '@/router/paths';
import { touchTarget } from '@/theme/patterns';
import { fonts } from '@/theme/tokens';

interface ReservationRowProps {
  reservation: MyReservationRead;
  /** Situação do check-in (#43), calculada pela página com as regras do campus. */
  checkin?: CheckinNote | null;
  onCancel: (reservation: MyReservationRead) => void;
  /** Encerrar o uso de uma reserva em andamento; sem ele, o botão não aparece. */
  onEnd?: (reservation: MyReservationRead) => void;
}

/**
 * Linha da lista de reservas (design system, seção 8): data à esquerda, espaço e horário,
 * status e ações à direita. No celular empilha.
 */
export function ReservationRow({
  reservation,
  checkin = null,
  onCancel,
  onEnd,
}: ReservationRowProps) {
  const status = displayStatus(reservation.status, reservation.fim);
  const date = campusToday(new Date(reservation.inicio));

  return (
    <Box
      sx={{
        display: 'grid',
        gap: { xs: 1, md: 3 },
        gridTemplateColumns: { xs: '1fr', md: '128px minmax(0, 1fr) auto' },
        alignItems: 'center',
        py: 2,
        px: { xs: 2, md: 2.5 },
      }}
    >
      <Typography sx={{ fontFamily: fonts.data, fontWeight: 500 }}>{dayLabel(date)}</Typography>
      <Box sx={{ minWidth: 0 }}>
        <Link
          component={RouterLink}
          to={`${paths.resource(reservation.recurso.id)}?data=${date}`}
          sx={{ ...touchTarget, fontWeight: 700 }}
        >
          {reservation.recurso.nome}
        </Link>
        <Typography variant="body2" color="text.secondary">
          {campusTime(reservation.inicio)} às {campusTime(reservation.fim)} ·{' '}
          {locationLabel(reservation.recurso)}
        </Typography>
        {checkin && <CheckinNoteLine note={checkin} />}
        {reservation.finalidade && (
          <Typography variant="body2" sx={{ mt: 0.25, overflowWrap: 'anywhere' }}>
            {reservation.finalidade}
          </Typography>
        )}
        {reservation.motivo_cancelamento && (
          <Typography variant="body2" sx={{ mt: 0.25, overflowWrap: 'anywhere' }}>
            <Box component="span" sx={{ fontWeight: 700 }}>
              Cancelada pela administração:
            </Box>{' '}
            {reservation.motivo_cancelamento}
          </Typography>
        )}
      </Box>
      <Stack
        direction="row"
        spacing={1}
        useFlexGap
        sx={{ alignItems: 'center', flexWrap: 'wrap', justifyContent: { md: 'flex-end' } }}
      >
        <Box sx={{ minWidth: 120 }}>
          <StatusLabel status={status} />
        </Box>
        <Button component={RouterLink} to={paths.receipt(reservation.codigo)} variant="outlined">
          Ver comprovante
        </Button>
        {status === 'CONFIRMADA' && reservation.pode_encerrar && onEnd && (
          <Button variant="outlined" onClick={() => onEnd(reservation)}>
            Encerrar uso
          </Button>
        )}
        {status === 'CONFIRMADA' &&
          !reservation.pode_encerrar &&
          !reservation.encerrada_em &&
          (reservation.pode_cancelar ? (
            <Button variant="outlined" color="error" onClick={() => onCancel(reservation)}>
              Cancelar
            </Button>
          ) : (
            <Tooltip title="Cancelamentos só até 30 min antes do início" describeChild>
              {/* aria-disabled em vez de disabled: continua focável, e o motivo aparece no teclado. */}
              <Button
                variant="outlined"
                aria-disabled="true"
                sx={{
                  color: 'text.disabled',
                  cursor: 'not-allowed',
                  '&:hover': { backgroundColor: 'transparent' },
                }}
              >
                Cancelar
              </Button>
            </Tooltip>
          ))}
      </Stack>
    </Box>
  );
}

export function ReservationRowSkeleton() {
  return (
    <Stack spacing={1} sx={{ py: 2, px: 2.5 }} aria-hidden>
      <Skeleton variant="rectangular" width="40%" height={20} />
      <Skeleton variant="rectangular" width="70%" height={16} />
    </Stack>
  );
}
