import HowToRegSharp from '@mui/icons-material/HowToRegSharp';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';
import { Link as RouterLink, useParams } from 'react-router';

import { DetailList } from '@/components/DetailList';
import { FormError } from '@/components/form/FormError';
import { LoadError } from '@/components/LoadError';
import { PageHeader } from '@/components/PageHeader';
import { locationLabel, resourceTypeLabels } from '@/domain/resource-types';
import { campusTime, campusToday, dayLabel } from '@/domain/schedule';
import { useCheckIn, useCheckinStatus } from '@/hooks/useCheckin';
import { useRules } from '@/hooks/useRules';
import { ApiError } from '@/lib/api/api-error';
import type { CheckinStatusRead, ReservationRead } from '@/lib/api/types';
import { loadFailure } from '@/lib/load-failure';
import { paths } from '@/router/paths';
import { colors, fonts } from '@/theme/tokens';

const panelSx = { border: 1, borderColor: 'divider', backgroundColor: 'background.paper', p: 3 };

function reservationItems(reservation: ReservationRead) {
  return [
    { label: 'Data', value: dayLabel(campusToday(new Date(reservation.inicio))) },
    {
      label: 'Horário',
      value: `${campusTime(reservation.inicio)} às ${campusTime(reservation.fim)}`,
    },
    { label: 'Código', value: reservation.codigo },
  ];
}

function Panel({ children }: { children: ReactNode }) {
  return (
    <Stack spacing={2.5} sx={panelSx}>
      {children}
    </Stack>
  );
}

/** O momento que importa: presença registrada, em destaque e com a hora. */
function Confirmed({ reservation }: { reservation: ReservationRead }) {
  return (
    <Panel>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', color: colors.success }}>
        <HowToRegSharp sx={{ fontSize: 40 }} aria-hidden />
        <Box>
          <Typography variant="h2" component="p" sx={{ color: 'inherit' }}>
            Presença confirmada
          </Typography>
          {reservation.checkin_em && (
            <Typography sx={{ fontFamily: fonts.data, color: colors.ink }}>
              às {campusTime(reservation.checkin_em)}
            </Typography>
          )}
        </Box>
      </Stack>
      <DetailList items={reservationItems(reservation)} />
      <Typography color="text.secondary">
        A sala é sua até {campusTime(reservation.fim)}. Bom uso.
      </Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
        <Button component={RouterLink} to={paths.receipt(reservation.codigo)} variant="outlined">
          Ver comprovante
        </Button>
        <Button component={RouterLink} to={paths.myReservations} variant="text">
          Minhas reservas
        </Button>
      </Stack>
    </Panel>
  );
}

function ResourceLinks({ resourceId }: { resourceId: number }) {
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
      <Button component={RouterLink} to={paths.resource(resourceId)} variant="contained">
        Ver horários deste espaço
      </Button>
      <Button component={RouterLink} to={paths.myReservations} variant="outlined">
        Minhas reservas
      </Button>
    </Stack>
  );
}

function CheckinState({ token, data }: { token: string; data: CheckinStatusRead }) {
  const checkIn = useCheckIn(token);
  const rules = useRules();
  const { reserva: reservation, recurso: resource } = data;

  if (checkIn.data) return <Confirmed reservation={checkIn.data} />;
  if (data.situacao === 'FEITO' && reservation) return <Confirmed reservation={reservation} />;

  if (data.situacao === 'DISPONIVEL' && reservation) {
    return (
      <Panel>
        <Typography variant="h2" component="p">
          Você chegou à sua reserva
        </Typography>
        <DetailList items={reservationItems(reservation)} />
        {rules.checkinToleranceMin > 0 && (
          <Typography color="text.secondary">
            Confirme a presença até {rules.checkinToleranceMin} minutos depois do início. Sem isso,
            a sala é liberada para outras pessoas.
          </Typography>
        )}
        <FormError message={checkIn.error ? ApiError.from(checkIn.error).message : null} />
        <Box>
          <Button
            variant="contained"
            size="large"
            startIcon={<HowToRegSharp />}
            disabled={checkIn.isPending}
            onClick={() => checkIn.mutate()}
          >
            {checkIn.isPending ? 'Confirmando…' : 'Confirmar presença'}
          </Button>
        </Box>
      </Panel>
    );
  }

  if (data.situacao === 'CEDO' && reservation && data.abre_em) {
    return (
      <Panel>
        <Typography variant="h2" component="p">
          Ainda é cedo para o check-in
        </Typography>
        <DetailList items={reservationItems(reservation)} />
        <Typography>
          O check-in abre às{' '}
          <Box component="strong" sx={{ fontFamily: fonts.data }}>
            {campusTime(data.abre_em)}
          </Box>
          . Leia o QR da porta de novo a partir desse horário.
        </Typography>
      </Panel>
    );
  }

  if (data.situacao === 'LIBERADA' && reservation) {
    return (
      <Panel>
        <Typography variant="h2" component="p">
          Esta reserva foi liberada
        </Typography>
        <DetailList items={reservationItems(reservation)} />
        <Typography>
          Não houve check-in até {rules.checkinToleranceMin} minutos depois do início
          {reservation.liberada_em
            ? `, e o horário voltou a ficar livre às ${campusTime(reservation.liberada_em)}`
            : ''}
          . Se o espaço ainda estiver livre, você pode reservar de novo.
        </Typography>
        <ResourceLinks resourceId={resource.id} />
      </Panel>
    );
  }

  return (
    <Panel>
      <Typography variant="h2" component="p">
        Você não tem reserva aqui agora
      </Typography>
      <Typography>
        Este QR confirma presença em reservas de {resource.nome}. Veja os horários livres e reserve
        pelo celular mesmo.
      </Typography>
      <ResourceLinks resourceId={resource.id} />
    </Panel>
  );
}

/** Aberta pelo QR fixado na porta do espaço (#43): confirma a presença de quem reservou. */
export default function CheckinPage() {
  const { token = '' } = useParams();
  const query = useCheckinStatus(token);
  const failure = loadFailure(query);
  const data = query.data;

  if (failure) {
    const invalid = ApiError.from(failure).status === 404;
    return (
      <>
        <PageHeader title={invalid ? 'QR Code não reconhecido' : 'Check-in'} />
        {invalid ? (
          <Panel>
            <Typography>{ApiError.from(failure).message}</Typography>
            <Box>
              <Button component={RouterLink} to={paths.reserve} variant="outlined">
                Reservar espaço
              </Button>
            </Box>
          </Panel>
        ) : (
          <LoadError error={failure} onRetry={() => void query.refetch()} />
        )}
      </>
    );
  }

  return (
    <Box sx={{ maxWidth: 640 }}>
      {data ? (
        <PageHeader
          title={data.recurso.nome}
          overline={`Check-in · ${resourceTypeLabels[data.recurso.tipo]}`}
          description={locationLabel(data.recurso)}
        />
      ) : (
        <Stack spacing={1.5} sx={{ mb: 3 }} aria-busy="true" aria-label="Carregando check-in">
          <Skeleton variant="rectangular" width={160} height={18} />
          <Skeleton variant="rectangular" width={280} height={40} />
        </Stack>
      )}
      {data ? (
        <CheckinState token={token} data={data} />
      ) : (
        <Skeleton variant="rectangular" height={260} aria-hidden />
      )}
    </Box>
  );
}
