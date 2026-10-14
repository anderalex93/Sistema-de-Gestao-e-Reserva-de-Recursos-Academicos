import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Pagination from '@mui/material/Pagination';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import { Fragment, useState } from 'react';
import { Link as RouterLink, useSearchParams } from 'react-router';

import { LoadError } from '@/components/LoadError';
import { PageHeader } from '@/components/PageHeader';
import { CancelReservationDialog } from '@/components/reservation/CancelReservationDialog';
import { ReservationRow, ReservationRowSkeleton } from '@/components/reservation/ReservationRow';
import { useMyReservations } from '@/hooks/useReservations';
import type { MyReservationRead, ReservationScope } from '@/lib/api/types';
import { loadFailure } from '@/lib/load-failure';
import { paths } from '@/router/paths';

const PER_PAGE = 10;

const EMPTY: Record<ReservationScope, string> = {
  proximas: 'Você não tem reservas marcadas.',
  historico: 'Suas reservas passadas e canceladas aparecem aqui.',
};

export default function MyReservationsPage() {
  const [params, setParams] = useSearchParams();
  const escopo: ReservationScope = params.get('aba') === 'historico' ? 'historico' : 'proximas';
  const page = Math.max(1, Number(params.get('page')) || 1);
  const query = useMyReservations({ escopo, page, per_page: PER_PAGE });
  const [cancelling, setCancelling] = useState<MyReservationRead | null>(null);
  const data = query.data;

  return (
    <>
      <PageHeader
        title="Minhas reservas"
        description="Próximas reservas e histórico."
        actions={
          <Button component={RouterLink} to={paths.reserve} variant="contained">
            Nova reserva
          </Button>
        }
      />

      <Tabs
        value={escopo}
        onChange={(_event, value: ReservationScope) =>
          setParams(value === 'historico' ? { aba: 'historico' } : {}, { replace: true })
        }
        aria-label="Minhas reservas"
        sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab value="proximas" label="Próximas" id="aba-proximas" aria-controls="painel-reservas" />
        <Tab
          value="historico"
          label="Histórico"
          id="aba-historico"
          aria-controls="painel-reservas"
        />
      </Tabs>

      <Box role="tabpanel" id="painel-reservas" aria-labelledby={`aba-${escopo}`}>
        {loadFailure(query) ? (
          <LoadError error={loadFailure(query)} onRetry={() => void query.refetch()} />
        ) : data?.total === 0 ? (
          <Box
            sx={{ border: 1, borderColor: 'divider', backgroundColor: 'background.paper', p: 3 }}
          >
            <Typography>{EMPTY[escopo]}</Typography>
            {escopo === 'proximas' && (
              <Button component={RouterLink} to={paths.reserve} variant="outlined" sx={{ mt: 2 }}>
                Reservar espaço
              </Button>
            )}
          </Box>
        ) : (
          <Box
            component="ul"
            aria-label={escopo === 'proximas' ? 'Próximas reservas' : 'Histórico de reservas'}
            aria-busy={query.isPending}
            sx={{
              m: 0,
              p: 0,
              listStyle: 'none',
              border: 1,
              borderColor: 'divider',
              backgroundColor: 'background.paper',
            }}
          >
            {data
              ? data.items.map((reservation, index) => (
                  <Fragment key={reservation.id}>
                    {index > 0 && <Divider component="li" aria-hidden />}
                    <li>
                      <ReservationRow reservation={reservation} onCancel={setCancelling} />
                    </li>
                  </Fragment>
                ))
              : Array.from({ length: 3 }, (_, index) => (
                  <li key={`esqueleto-${index}`}>
                    <ReservationRowSkeleton />
                  </li>
                ))}
          </Box>
        )}

        {data && data.total_pages > 1 && (
          <Pagination
            count={data.total_pages}
            page={page}
            onChange={(_event, next) =>
              setParams({
                ...(escopo === 'historico' ? { aba: 'historico' } : {}),
                page: String(next),
              })
            }
            shape="rounded"
            variant="outlined"
            sx={{ mt: 3, '& ul': { justifyContent: 'center' } }}
          />
        )}
      </Box>

      {cancelling && (
        <CancelReservationDialog reservation={cancelling} onClose={() => setCancelling(null)} />
      )}
    </>
  );
}
