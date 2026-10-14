import BlockSharp from '@mui/icons-material/BlockSharp';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { Fragment } from 'react';
import { Link as RouterLink } from 'react-router';

import { resourceSituation, situationLabels } from '@/domain/catalog-admin';
import { capacityLabel, locationLabel, resourceTypeLabels } from '@/domain/resource-types';
import type { ResourceAdminRead } from '@/lib/api/types';
import { paths } from '@/router/paths';
import { colors } from '@/theme/tokens';

export interface ResourceActions {
  onEdit: (resource: ResourceAdminRead) => void;
  onRemove: (resource: ResourceAdminRead) => void;
  onReactivate: (resource: ResourceAdminRead) => void;
  /** Recurso sendo reativado agora, para travar o botão contra clique duplo. */
  reactivatingId: number | null;
}

interface ResourceViewProps extends ResourceActions {
  /** `undefined` enquanto carrega. */
  items: readonly ResourceAdminRead[] | undefined;
}

const COLUMNS = ['Nome', 'Tipo', 'Local', 'Capacidade', 'Características', 'Situação', 'Ações'];

function Situation({ resource }: { resource: ResourceAdminRead }) {
  const situation = resourceSituation(resource);
  if (situation === 'ATIVO') return <>{situationLabels.ATIVO}</>;
  return (
    <Stack
      direction="row"
      spacing={0.75}
      sx={{ alignItems: 'center', color: colors.warning, fontWeight: 700 }}
    >
      <BlockSharp sx={{ fontSize: 16 }} aria-hidden />
      <span>{situationLabels[situation]}</span>
    </Stack>
  );
}

function RowActions({
  resource,
  onEdit,
  onRemove,
  onReactivate,
  reactivatingId,
}: ResourceActions & {
  resource: ResourceAdminRead;
}) {
  return (
    <Stack direction="row" spacing={1} sx={{ flexWrap: { xs: 'wrap', md: 'nowrap' } }} useFlexGap>
      <Button
        variant="outlined"
        onClick={() => onEdit(resource)}
        aria-label={`Editar ${resource.nome}`}
      >
        Editar
      </Button>
      {resource.ativo && (
        <Button
          component={RouterLink}
          to={paths.adminResourceQr(resource.id)}
          variant="outlined"
          aria-label={`QR da porta de ${resource.nome}`}
        >
          QR da porta
        </Button>
      )}
      {resource.ativo ? (
        <Button
          variant="outlined"
          color="error"
          onClick={() => onRemove(resource)}
          aria-label={`Remover ${resource.nome}`}
        >
          Remover
        </Button>
      ) : (
        <Button
          variant="outlined"
          onClick={() => onReactivate(resource)}
          disabled={reactivatingId === resource.id}
          aria-label={`Reativar ${resource.nome}`}
        >
          Reativar
        </Button>
      )}
    </Stack>
  );
}

function features(resource: ResourceAdminRead): string {
  return resource.caracteristicas.map((feature) => feature.nome).join(', ') || 'Nenhuma';
}

/** Desktop: tabela com todas as colunas. */
export function ResourceTable({ items, ...actions }: ResourceViewProps) {
  return (
    <Box sx={{ overflowX: 'auto' }}>
      <Table aria-label="Recursos" aria-busy={!items}>
        <TableHead sx={{ backgroundColor: colors.sunken }}>
          <TableRow>
            {COLUMNS.map((column) => (
              <TableCell key={column} sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                {column}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {!items &&
            Array.from({ length: 5 }, (_, row) => (
              <TableRow key={`esqueleto-${row}`}>
                {COLUMNS.map((column) => (
                  <TableCell key={column}>
                    <Skeleton variant="rectangular" height={16} />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          {items?.map((resource) => (
            <TableRow key={resource.id}>
              <TableCell sx={{ fontWeight: 700 }}>{resource.nome}</TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>
                {resourceTypeLabels[resource.tipo]}
              </TableCell>
              <TableCell>{locationLabel(resource)}</TableCell>
              <TableCell>
                {resource.capacidade === null ? (
                  <Typography variant="body2" color="text.secondary">
                    Sem lotação
                  </Typography>
                ) : (
                  <Typography variant="data">{resource.capacidade}</Typography>
                )}
              </TableCell>
              <TableCell sx={{ minWidth: 160 }}>{features(resource)}</TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>
                <Situation resource={resource} />
              </TableCell>
              <TableCell>
                <RowActions resource={resource} {...actions} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}

/** Celular: uma linha empilhada por recurso, separadas por fio. */
export function ResourceList({ items, ...actions }: ResourceViewProps) {
  return (
    <Box
      component="ul"
      aria-label="Recursos"
      aria-busy={!items}
      sx={{ m: 0, p: 0, listStyle: 'none' }}
    >
      {items
        ? items.map((resource, index) => (
            <Fragment key={resource.id}>
              {index > 0 && <Divider component="li" aria-hidden />}
              <Stack component="li" spacing={1} sx={{ p: 2 }}>
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ justifyContent: 'space-between', alignItems: 'baseline' }}
                >
                  <Typography sx={{ fontWeight: 700, overflowWrap: 'anywhere' }}>
                    {resource.nome}
                  </Typography>
                  <Box sx={{ flexShrink: 0, fontSize: '0.875rem' }}>
                    <Situation resource={resource} />
                  </Box>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  {[
                    resourceTypeLabels[resource.tipo],
                    locationLabel(resource),
                    capacityLabel(resource),
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </Typography>
                <Typography variant="body2">Características: {features(resource)}</Typography>
                <RowActions resource={resource} {...actions} />
              </Stack>
            </Fragment>
          ))
        : Array.from({ length: 3 }, (_, index) => (
            <Stack component="li" key={`esqueleto-${index}`} spacing={1} sx={{ p: 2 }}>
              <Skeleton width="50%" />
              <Skeleton width="80%" />
              <Skeleton variant="rectangular" height={44} width={180} />
            </Stack>
          ))}
    </Box>
  );
}
