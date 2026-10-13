import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Link as RouterLink } from 'react-router';

import { DetailList } from '@/components/DetailList';
import { LoadError } from '@/components/LoadError';
import { PageHeader } from '@/components/PageHeader';
import { locationLabel } from '@/domain/resource-types';
import { campusTime, campusToday, dayLabel } from '@/domain/schedule';
import { useAuth } from '@/hooks/useAuth';
import { useMyReservations } from '@/hooks/useReservations';
import { paths } from '@/router/paths';
import { fonts } from '@/theme/tokens';

const panelSx = {
  border: 1,
  borderColor: 'divider',
  backgroundColor: 'background.paper',
  p: 3,
  maxWidth: 640,
};

function NextReservation() {
  const query = useMyReservations({ escopo: 'proximas', page: 1, per_page: 1 });
  const next = query.data?.items[0];

  if (query.isError) return <LoadError error={query.error} onRetry={() => void query.refetch()} />;
  if (query.isPending) {
    return (
      <Box sx={panelSx} aria-busy="true" aria-label="Carregando sua próxima reserva">
        <Skeleton variant="rectangular" width="50%" height={24} />
        <Skeleton variant="rectangular" height={96} sx={{ mt: 2 }} />
      </Box>
    );
  }
  if (!next) {
    return (
      <Box sx={panelSx}>
        <Typography>Você não tem reservas marcadas.</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Veja o que está livre no quadro de horários ou procure um espaço.
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 2 }}>
          <Button component={RouterLink} to={paths.reserve} variant="contained">
            Nova reserva
          </Button>
          <Button component={RouterLink} to={paths.board} variant="outlined">
            Quadro de horários
          </Button>
        </Stack>
      </Box>
    );
  }

  const total = query.data?.total ?? 1;
  return (
    <Box component="section" aria-labelledby="proxima-reserva-titulo" sx={panelSx}>
      <Typography id="proxima-reserva-titulo" variant="overline" component="h2">
        Sua próxima reserva
      </Typography>
      <Typography variant="h2" component="p" sx={{ mt: 0.5, mb: 2 }}>
        {next.recurso.nome}
      </Typography>
      <DetailList
        items={[
          { label: 'Data', value: dayLabel(campusToday(new Date(next.inicio))) },
          {
            label: 'Horário',
            value: (
              <Box component="span" sx={{ fontFamily: fonts.data }}>
                {campusTime(next.inicio)} às {campusTime(next.fim)}
              </Box>
            ),
          },
          { label: 'Local', value: locationLabel(next.recurso) },
          { label: 'Código', value: next.codigo },
        ]}
      />
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 2.5 }}>
        <Button component={RouterLink} to={paths.receipt(next.codigo)} variant="outlined">
          Ver comprovante
        </Button>
        {total > 1 && (
          <Link component={RouterLink} to={paths.myReservations} sx={{ alignSelf: 'center' }}>
            {`Ver todas as ${total} reservas`}
          </Link>
        )}
      </Stack>
    </Box>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const firstName = user?.nome.split(' ')[0] ?? '';

  return (
    <>
      <PageHeader
        title="Início"
        overline={firstName ? `Olá, ${firstName}` : undefined}
        description="Sua próxima reserva e o atalho para reservar um espaço."
        actions={
          <Button component={RouterLink} to={paths.reserve} variant="contained">
            Nova reserva
          </Button>
        }
      />
      <NextReservation />
    </>
  );
}
