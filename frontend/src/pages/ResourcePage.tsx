import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router';

import { AvailabilitySection } from '@/components/availability/AvailabilitySection';
import { ReservationDialog } from '@/components/reservation/ReservationDialog';
import { FeatureChips } from '@/components/catalog/FeatureChips';
import { DetailList, type DetailItem } from '@/components/DetailList';
import { LoadError } from '@/components/LoadError';
import { PageHeader } from '@/components/PageHeader';
import { capacityLabel, resourceTypeLabels } from '@/domain/resource-types';
import { activeLimitFor } from '@/domain/rules';
import { useAuth } from '@/hooks/useAuth';
import { useResource } from '@/hooks/useCatalog';
import { useMyReservations } from '@/hooks/useReservations';
import { useRules } from '@/hooks/useRules';
import { ApiError } from '@/lib/api/api-error';
import type { SelectedInterval } from '@/domain/slot-selection';
import type { ResourceRead } from '@/lib/api/types';
import { paths } from '@/router/paths';

const panelSx = {
  border: 1,
  borderColor: 'divider',
  backgroundColor: 'background.paper',
  p: 3,
  maxWidth: 720,
} as const;

function details(resource: ResourceRead): DetailItem[] {
  const capacity = capacityLabel(resource);
  return [
    { label: 'Tipo', value: resourceTypeLabels[resource.tipo] },
    { label: 'Bloco', value: resource.bloco.nome },
    ...(resource.bloco.descricao
      ? [{ label: 'Sobre o bloco', value: resource.bloco.descricao }]
      : []),
    ...(resource.andar ? [{ label: 'Andar', value: resource.andar }] : []),
    ...(capacity ? [{ label: 'Capacidade', value: capacity }] : []),
    {
      label: 'Características',
      value:
        resource.caracteristicas.length > 0 ? (
          <FeatureChips features={resource.caracteristicas} label="Características" />
        ) : (
          'Nenhuma informada'
        ),
    },
  ];
}

function NotFound() {
  return (
    <>
      <PageHeader
        title="Recurso não encontrado"
        description="Este recurso não existe ou foi desativado pela administração."
        breadcrumbs={[{ label: 'Reservar', to: paths.reserve }, { label: 'Não encontrado' }]}
      />
      <Button component={RouterLink} to={paths.reserve} variant="contained">
        Ver todos os recursos
      </Button>
    </>
  );
}

function ResourceSkeleton() {
  return (
    <Stack spacing={1.5} aria-busy="true" aria-label="Carregando recurso">
      <Skeleton variant="rectangular" width={180} height={20} />
      <Skeleton variant="rectangular" width={320} height={40} />
      <Skeleton variant="rectangular" height={220} sx={{ mt: 2, maxWidth: 720 }} />
    </Stack>
  );
}

export default function ResourcePage() {
  const { id = '' } = useParams();
  const resourceId = Number(id);
  const query = useResource(resourceId);
  const { user } = useAuth();
  const rules = useRules();
  const upcoming = useMyReservations({ escopo: 'proximas', page: 1, per_page: 1 });
  const limit = user ? activeLimitFor(rules, user.perfil) : null;
  const active = upcoming.data?.total ?? 0;
  // Avisa antes de chamar a API; o back continua sendo quem garante a regra (#28).
  const atLimit = limit !== null && active >= limit;
  const [pending, setPending] = useState<{
    interval: SelectedInterval;
    date: string;
    clearSelection: () => void;
  } | null>(null);

  const notFound =
    !Number.isInteger(resourceId) ||
    resourceId <= 0 ||
    (query.isError && ApiError.from(query.error).status === 404);
  if (notFound) return <NotFound />;

  if (query.isError) {
    return (
      <>
        <PageHeader
          title="Recurso"
          breadcrumbs={[{ label: 'Reservar', to: paths.reserve }, { label: 'Recurso' }]}
        />
        <LoadError error={query.error} onRetry={() => void query.refetch()} />
      </>
    );
  }

  const resource = query.data;
  if (!resource) return <ResourceSkeleton />;

  return (
    <>
      <PageHeader
        title={resource.nome}
        overline={resourceTypeLabels[resource.tipo]}
        breadcrumbs={[
          { label: 'Reservar', to: paths.reserve },
          { label: resource.bloco.nome },
          { label: resource.nome },
        ]}
      />
      <Stack spacing={3}>
        <Box sx={panelSx}>
          <DetailList items={details(resource)} />
          {resource.descricao && (
            <Typography sx={{ mt: 2.5, maxWidth: '65ch' }}>{resource.descricao}</Typography>
          )}
        </Box>
        <AvailabilitySection
          resourceId={resource.id}
          resourceName={resource.nome}
          renderActions={(interval, date, clearSelection) =>
            atLimit ? (
              <Typography sx={{ maxWidth: '40ch' }}>
                Você já tem {active} reservas ativas, o limite do seu perfil.{' '}
                <Link component={RouterLink} to={paths.myReservations}>
                  Ver minhas reservas
                </Link>
              </Typography>
            ) : (
              <Button
                variant="contained"
                onClick={() => setPending({ interval, date, clearSelection })}
              >
                Reservar este horário
              </Button>
            )
          }
        />
        {pending && (
          <ReservationDialog
            open
            resource={resource}
            date={pending.date}
            interval={pending.interval}
            onClose={() => setPending(null)}
            onConflict={pending.clearSelection}
          />
        )}
      </Stack>
    </>
  );
}
