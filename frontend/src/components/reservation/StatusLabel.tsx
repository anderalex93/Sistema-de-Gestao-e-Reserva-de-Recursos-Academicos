import EventAvailableSharp from '@mui/icons-material/EventAvailableSharp';
import EventBusySharp from '@mui/icons-material/EventBusySharp';
import HistorySharp from '@mui/icons-material/HistorySharp';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import type { DisplayStatus } from '@/domain/reservation-status';
import { colors } from '@/theme/tokens';

const STYLES = {
  CONFIRMADA: { label: 'Confirmada', color: colors.success, Icon: EventAvailableSharp },
  CANCELADA: { label: 'Cancelada', color: colors.error, Icon: EventBusySharp },
  CONCLUIDA: { label: 'Concluída', color: colors.inkMuted, Icon: HistorySharp },
} as const;

/** Rótulo de status do design system: caixa alta, ícone e cor, sem fundo cheio. */
export function StatusLabel({
  status,
  size = 'small',
}: {
  status: DisplayStatus;
  size?: 'small' | 'large';
}) {
  const { label, color, Icon } = STYLES[status];
  const large = size === 'large';
  return (
    <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', color }}>
      <Icon sx={{ fontSize: large ? 24 : 16 }} aria-hidden />
      <Typography
        component="span"
        sx={{
          fontSize: large ? '1rem' : '0.75rem',
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'inherit',
        }}
      >
        {label}
      </Typography>
    </Stack>
  );
}
