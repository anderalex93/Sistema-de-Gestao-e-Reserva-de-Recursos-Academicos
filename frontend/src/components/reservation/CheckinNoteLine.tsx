import HowToRegSharp from '@mui/icons-material/HowToRegSharp';
import LogoutSharp from '@mui/icons-material/LogoutSharp';
import PersonOffSharp from '@mui/icons-material/PersonOffSharp';
import QrCode2Sharp from '@mui/icons-material/QrCode2Sharp';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import type { CheckinNote } from '@/domain/checkin';
import { colors } from '@/theme/tokens';

const STYLES = {
  feito: { Icon: HowToRegSharp, color: colors.success },
  encerrada: { Icon: LogoutSharp, color: colors.ink },
  liberada: { Icon: PersonOffSharp, color: colors.warning },
  pendente: { Icon: QrCode2Sharp, color: colors.inkMuted },
} as const;

/** Situação do check-in (#43) com ícone, para nunca depender só da cor. */
export function CheckinNoteLine({ note }: { note: CheckinNote }) {
  const { Icon, color } = STYLES[note.kind];
  return (
    <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', mt: 0.5, color }}>
      <Icon sx={{ fontSize: 18 }} aria-hidden />
      <Typography
        variant="body2"
        sx={{
          color: note.kind === 'pendente' ? 'text.secondary' : 'inherit',
          fontWeight: note.kind === 'pendente' ? 400 : 700,
        }}
      >
        {note.text}
      </Typography>
    </Stack>
  );
}
