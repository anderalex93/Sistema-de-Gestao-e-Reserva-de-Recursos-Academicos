import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import MenuItem from '@mui/material/MenuItem';
import OutlinedInput from '@mui/material/OutlinedInput';
import Pagination from '@mui/material/Pagination';
import Select from '@mui/material/Select';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Fragment, useId, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router';

import { AdminCancelDialog } from '@/components/admin/AdminCancelDialog';
import { LoadError } from '@/components/LoadError';
import { PageHeader } from '@/components/PageHeader';
import { StatusLabel } from '@/components/reservation/StatusLabel';
import { displayStatus } from '@/domain/reservation-status';
import { locationLabel } from '@/domain/resource-types';
import { campusTime, campusToday, dayLabel } from '@/domain/schedule';
import { useAdminAgenda } from '@/hooks/useAdminAgenda';
import { useAdminBuildings } from '@/hooks/useAdminCatalog';
import type { AgendaParams } from '@/lib/api/admin-reservations.api';
import type { AdminReservationRead, ReservationStatus } from '@/lib/api/types';
import { paths } from '@/router/paths';
import { fonts } from '@/theme/tokens';

const PER_PAGE = 100;
const ANY = '';
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const STATUSES: readonly ReservationStatus[] = ['CONFIRMADA', 'CANCELADA'];
const labelSx = { mb: 0.75, fontWeight: 700, fontSize: '0.875rem', color: 'text.primary' };

interface Group {
  resource: AdminReservationRead['recurso'];
  reservations: AdminReservationRead[];
}

/** A API já ordena por bloco, recurso e horário: basta juntar as reservas vizinhas. */
function groupByResource(items: readonly AdminReservationRead[]): Group[] {
  const groups: Group[] = [];
  for (const reservation of items) {
    const last = groups.at(-1);
    if (last?.resource.id === reservation.recurso.id) {
      last.reservations.push(reservation);
    } else {
      groups.push({ resource: reservation.recurso, reservations: [reservation] });
    }
  }
  return groups;
}

function readParams(params: URLSearchParams): AgendaParams {
  const data = params.get('data') ?? '';
  const bloco = Number(params.get('bloco'));
  const status = params.get('status');
  return {
    data: DATE_PATTERN.test(data) ? data : campusToday(),
    page: Math.max(1, Number(params.get('page')) || 1),
    per_page: PER_PAGE,
    ...(Number.isInteger(bloco) && bloco > 0 ? { bloco_id: bloco } : {}),
    ...(STATUSES.includes(status as ReservationStatus)
      ? { status: status as ReservationStatus }
      : {}),
  };
}

function Filter({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <FormControl fullWidth>
      <FormLabel id={`${id}-rotulo`} htmlFor={id} sx={labelSx}>
        {label}
      </FormLabel>
      {children}
    </FormControl>
  );
}

function AgendaRow({
  reservation,
  onCancel,
}: {
  reservation: AdminReservationRead;
  onCancel: (reservation: AdminReservationRead) => void;
}) {
  const status = displayStatus(reservation.status, reservation.fim);
  return (
    <Box
      sx={{
        display: 'grid',
        gap: { xs: 1, md: 3 },
        gridTemplateColumns: { xs: '1fr', md: 'max-content minmax(0, 1fr) auto' },
        alignItems: 'center',
        py: 2,
        px: { xs: 2, md: 2.5 },
      }}
    >
      <Typography sx={{ fontFamily: fonts.data, fontWeight: 500, whiteSpace: 'nowrap' }}>
        {campusTime(reservation.inicio)} às {campusTime(reservation.fim)}
      </Typography>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontWeight: 700 }}>{reservation.usuario.nome}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
          {reservation.usuario.email} · {reservation.codigo}
        </Typography>
        {reservation.finalidade && (
          <Typography variant="body2" sx={{ mt: 0.25, overflowWrap: 'anywhere' }}>
            {reservation.finalidade}
          </Typography>
        )}
        {reservation.motivo_cancelamento && (
          <Typography variant="body2" sx={{ mt: 0.25, overflowWrap: 'anywhere' }}>
            <Box component="span" sx={{ fontWeight: 700 }}>
              Motivo:
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
        {status === 'CONFIRMADA' && (
          <Button
            variant="outlined"
            color="error"
            onClick={() => onCancel(reservation)}
            aria-label={`Cancelar reserva de ${reservation.usuario.nome} às ${campusTime(reservation.inicio)}`}
          >
            Cancelar
          </Button>
        )}
      </Stack>
    </Box>
  );
}

export default function AdminAgendaPage() {
  const id = useId();
  const [urlParams, setUrlParams] = useSearchParams();
  const params = readParams(urlParams);
  const query = useAdminAgenda(params);
  const buildings = useAdminBuildings();
  const [cancelling, setCancelling] = useState<AdminReservationRead | null>(null);
  const data = query.data;

  const update = (patch: Record<string, string | null>) =>
    setUrlParams(
      (current) => {
        const next = new URLSearchParams(current);
        Object.entries(patch).forEach(([key, value]) =>
          value ? next.set(key, value) : next.delete(key),
        );
        if (!('page' in patch)) next.delete('page');
        return next;
      },
      { replace: true },
    );

  return (
    <>
      <PageHeader
        title="Agenda do dia"
        description="Todas as reservas do campus no dia, com quem reservou."
        breadcrumbs={[{ label: 'Administração', to: paths.admin }, { label: 'Agenda do dia' }]}
      />

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          mb: 3,
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 180px), 1fr))',
        }}
      >
        <Filter id={`${id}-data`} label="Data">
          <OutlinedInput
            id={`${id}-data`}
            type="date"
            value={params.data}
            onChange={(event) => update({ data: event.target.value || null })}
          />
        </Filter>
        <Filter id={`${id}-bloco`} label="Bloco">
          <Select
            id={`${id}-bloco`}
            labelId={`${id}-bloco-rotulo`}
            value={params.bloco_id === undefined ? ANY : String(params.bloco_id)}
            onChange={(event) => update({ bloco: event.target.value || null })}
            displayEmpty
          >
            <MenuItem value={ANY}>Todos os blocos</MenuItem>
            {buildings.data?.map((building) => (
              <MenuItem key={building.id} value={String(building.id)}>
                {building.nome}
              </MenuItem>
            ))}
          </Select>
        </Filter>
        <Filter id={`${id}-status`} label="Situação">
          <Select
            id={`${id}-status`}
            labelId={`${id}-status-rotulo`}
            value={params.status ?? ANY}
            onChange={(event) => update({ status: event.target.value || null })}
            displayEmpty
          >
            <MenuItem value={ANY}>Todas</MenuItem>
            <MenuItem value="CONFIRMADA">Confirmadas</MenuItem>
            <MenuItem value="CANCELADA">Canceladas</MenuItem>
          </Select>
        </Filter>
      </Box>

      <Typography variant="h2" sx={{ fontSize: '1.25rem', mb: 2 }}>
        {dayLabel(params.data)}
        {data && ` · ${data.total === 1 ? '1 reserva' : `${data.total} reservas`}`}
      </Typography>

      {query.isError && !data ? (
        <LoadError error={query.error} onRetry={() => void query.refetch()} />
      ) : data?.total === 0 ? (
        <Box sx={{ border: 1, borderColor: 'divider', backgroundColor: 'background.paper', p: 3 }}>
          <Typography>Nenhuma reserva neste dia com estes filtros.</Typography>
        </Box>
      ) : !data ? (
        <Stack spacing={1} aria-busy="true" aria-label="Carregando a agenda">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} variant="rectangular" height={72} />
          ))}
        </Stack>
      ) : (
        <Stack spacing={3}>
          {groupByResource(data.items).map((group) => (
            <Box
              component="section"
              key={group.resource.id}
              aria-labelledby={`${id}-r${group.resource.id}`}
            >
              <Typography
                variant="h3"
                id={`${id}-r${group.resource.id}`}
                sx={{ fontSize: '1.0625rem', fontWeight: 700, mb: 0.5 }}
              >
                {group.resource.nome}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {locationLabel(group.resource)}
              </Typography>
              <Box
                component="ul"
                aria-label={`Reservas de ${group.resource.nome}`}
                sx={{
                  m: 0,
                  p: 0,
                  listStyle: 'none',
                  border: 1,
                  borderColor: 'divider',
                  backgroundColor: 'background.paper',
                }}
              >
                {group.reservations.map((reservation, index) => (
                  <Fragment key={reservation.id}>
                    {index > 0 && <Divider component="li" aria-hidden />}
                    <li>
                      <AgendaRow reservation={reservation} onCancel={setCancelling} />
                    </li>
                  </Fragment>
                ))}
              </Box>
            </Box>
          ))}
        </Stack>
      )}

      {data && data.total_pages > 1 && (
        <Pagination
          count={data.total_pages}
          page={params.page}
          onChange={(_event, page) => update({ page: String(page) })}
          sx={{ mt: 3 }}
        />
      )}

      {cancelling && (
        <AdminCancelDialog reservation={cancelling} onClose={() => setCancelling(null)} />
      )}
    </>
  );
}
