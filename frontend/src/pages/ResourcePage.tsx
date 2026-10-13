import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Link as RouterLink, useParams } from 'react-router';

import { FeatureChips } from '@/components/catalog/FeatureChips';
import { DetailList, type DetailItem } from '@/components/DetailList';
import { LoadError } from '@/components/LoadError';
import { PageHeader } from '@/components/PageHeader';
import { UpcomingSection } from '@/components/UpcomingSection';
import { capacityLabel, resourceTypeLabels } from '@/domain/resource-types';
import { useResource } from '@/hooks/useCatalog';
import { ApiError } from '@/lib/api/api-error';
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
        <UpcomingSection issue={22}>A grade de horários do dia aparece aqui.</UpcomingSection>
      </Stack>
    </>
  );
}
