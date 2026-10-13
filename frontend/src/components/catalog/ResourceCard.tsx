import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Link as RouterLink } from 'react-router';

import { FeatureChips } from '@/components/catalog/FeatureChips';
import {
  capacityLabel,
  locationLabel,
  resourceTypeIcons,
  resourceTypeLabels,
} from '@/domain/resource-types';
import type { ResourceRead } from '@/lib/api/types';
import { paths } from '@/router/paths';
import { colors } from '@/theme/tokens';

const tileSx = {
  display: 'flex',
  flexDirection: 'column',
  gap: 1.5,
  height: '100%',
  p: 2.5,
  border: 1,
  borderColor: 'divider',
  backgroundColor: 'background.paper',
} as const;

/** Recurso na lista de reserva. O bloco inteiro é o link para o detalhe. */
export function ResourceCard({ resource }: { resource: ResourceRead }) {
  const Icon = resourceTypeIcons[resource.tipo];
  const capacity = capacityLabel(resource);

  return (
    <Box
      component={RouterLink}
      to={paths.resource(resource.id)}
      sx={{
        ...tileSx,
        color: 'inherit',
        textDecoration: 'none',
        '&:hover': { backgroundColor: colors.sunken, borderColor: colors.lineStrong },
      }}
    >
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', color: 'text.secondary' }}>
        <Icon sx={{ fontSize: 20 }} aria-hidden />
        <Typography variant="overline" component="span">
          {resourceTypeLabels[resource.tipo]}
        </Typography>
      </Stack>
      <Box>
        <Typography variant="h3" component="h2">
          {resource.nome}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {capacity ? `${locationLabel(resource)} · ${capacity}` : locationLabel(resource)}
        </Typography>
      </Box>
      <FeatureChips
        features={resource.caracteristicas}
        label={`Características de ${resource.nome}`}
      />
    </Box>
  );
}

/** Mesma geometria do card, para não haver salto quando a lista chega. */
export function ResourceCardSkeleton() {
  return (
    <Box sx={tileSx} aria-hidden>
      <Skeleton variant="rectangular" width={120} height={16} />
      <Skeleton variant="rectangular" width="70%" height={24} />
      <Skeleton variant="rectangular" width="50%" height={18} />
      <Skeleton variant="rectangular" width="85%" height={24} />
    </Box>
  );
}
