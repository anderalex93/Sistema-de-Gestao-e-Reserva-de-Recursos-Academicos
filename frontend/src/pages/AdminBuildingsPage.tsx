import AddSharp from '@mui/icons-material/AddSharp';
import BlockSharp from '@mui/icons-material/BlockSharp';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import { Fragment, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router';

import { BuildingFormDialog } from '@/components/admin/BuildingFormDialog';
import { FeatureFormDialog } from '@/components/admin/FeatureFormDialog';
import { RemovalDialog } from '@/components/admin/RemovalDialog';
import { LoadError } from '@/components/LoadError';
import { PageHeader } from '@/components/PageHeader';
import { removalMessage } from '@/domain/catalog-admin';
import { useAdminBuildings, useAdminFeatures, useCatalogMutation } from '@/hooks/useAdminCatalog';
import { useFeedback } from '@/hooks/useFeedback';
import { adminCatalogApi } from '@/lib/api';
import { ApiError } from '@/lib/api/api-error';
import type { BuildingAdminRead, FeatureAdminRead } from '@/lib/api/types';
import { loadFailure } from '@/lib/load-failure';
import { paths } from '@/router/paths';
import { colors } from '@/theme/tokens';

type TabValue = 'blocos' | 'caracteristicas';

function resourcesLabel(count: number): string {
  if (count === 0) return 'Nenhum recurso';
  return count === 1 ? '1 recurso' : `${count} recursos`;
}

interface Row {
  id: number;
  title: string;
  details: ReactNode;
  actions: ReactNode;
}

/** Lista com fio divisório (design system): uma linha por item, empilha no celular. */
function RowList({ label, rows }: { label: string; rows: readonly Row[] | undefined }) {
  return (
    <Box
      component="ul"
      aria-label={label}
      aria-busy={!rows}
      sx={{
        m: 0,
        p: 0,
        listStyle: 'none',
        border: 1,
        borderColor: 'divider',
        backgroundColor: 'background.paper',
      }}
    >
      {rows
        ? rows.map((row, index) => (
            <Fragment key={row.id}>
              {index > 0 && <Divider component="li" aria-hidden />}
              <Stack
                component="li"
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1.5}
                sx={{
                  p: 2,
                  justifyContent: 'space-between',
                  alignItems: { xs: 'stretch', sm: 'center' },
                }}
              >
                <Stack spacing={0.5} sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 700, overflowWrap: 'anywhere' }}>
                    {row.title}
                  </Typography>
                  {row.details}
                </Stack>
                <Stack
                  direction="row"
                  spacing={1}
                  useFlexGap
                  sx={{ flexWrap: 'wrap', flexShrink: 0 }}
                >
                  {row.actions}
                </Stack>
              </Stack>
            </Fragment>
          ))
        : Array.from({ length: 3 }, (_, index) => (
            <Stack component="li" key={`esqueleto-${index}`} spacing={1} sx={{ p: 2 }}>
              <Skeleton width="40%" />
              <Skeleton width="60%" />
            </Stack>
          ))}
    </Box>
  );
}

function BuildingsTab() {
  const { notify } = useFeedback();
  const query = useAdminBuildings();
  const [editing, setEditing] = useState<BuildingAdminRead | null | undefined>(undefined);
  const [removing, setRemoving] = useState<BuildingAdminRead | null>(null);
  const reactivate = useCatalogMutation((building: BuildingAdminRead) =>
    adminCatalogApi.reactivateBuilding(building.id),
  );

  const rows = query.data?.map((building) => ({
    id: building.id,
    title: building.nome,
    details: (
      <>
        {building.descricao && (
          <Typography variant="body2" color="text.secondary">
            {building.descricao}
          </Typography>
        )}
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <Typography variant="body2">{resourcesLabel(building.total_recursos)}</Typography>
          {!building.ativo && (
            <Stack
              direction="row"
              spacing={0.75}
              sx={{
                alignItems: 'center',
                color: colors.warning,
                fontWeight: 700,
                fontSize: '0.875rem',
              }}
            >
              <BlockSharp sx={{ fontSize: 16 }} aria-hidden />
              <span>Desativado</span>
            </Stack>
          )}
        </Stack>
      </>
    ),
    actions: (
      <>
        <Button
          variant="outlined"
          onClick={() => setEditing(building)}
          aria-label={`Editar ${building.nome}`}
        >
          Editar
        </Button>
        {building.ativo ? (
          <Button
            variant="outlined"
            color="error"
            onClick={() => setRemoving(building)}
            aria-label={`Remover ${building.nome}`}
          >
            Remover
          </Button>
        ) : (
          <Button
            variant="outlined"
            disabled={reactivate.isPending && reactivate.variables.id === building.id}
            aria-label={`Reativar ${building.nome}`}
            onClick={() =>
              reactivate.mutate(building, {
                onSuccess: (saved) =>
                  notify({
                    message: `Reativamos ${saved.nome}. Os recursos ativos dele voltaram para a busca.`,
                    severity: 'success',
                  }),
                onError: (error) =>
                  notify({ message: ApiError.from(error).message, severity: 'error' }),
              })
            }
          >
            Reativar
          </Button>
        )}
      </>
    ),
  }));

  return (
    <>
      <Stack direction="row" sx={{ justifyContent: 'flex-end', mb: 2 }}>
        <Button variant="contained" startIcon={<AddSharp />} onClick={() => setEditing(null)}>
          Novo bloco
        </Button>
      </Stack>
      {loadFailure(query) ? (
        <LoadError error={loadFailure(query)} onRetry={() => void query.refetch()} />
      ) : rows?.length === 0 ? (
        <Box sx={{ border: 1, borderColor: 'divider', backgroundColor: 'background.paper', p: 3 }}>
          <Typography>
            Nenhum bloco cadastrado ainda. Crie o primeiro para cadastrar recursos.
          </Typography>
        </Box>
      ) : (
        <RowList label="Blocos" rows={rows} />
      )}

      {editing !== undefined && (
        <BuildingFormDialog building={editing} onClose={() => setEditing(undefined)} />
      )}
      {removing && (
        <RemovalDialog
          title={`Remover ${removing.nome}?`}
          confirmLabel="Remover bloco"
          remove={(force) => adminCatalogApi.removeBuilding(removing.id, force)}
          onRemoved={(result) => {
            notify({ message: removalMessage(removing.nome, result), severity: 'success' });
            setRemoving(null);
          }}
          onClose={() => setRemoving(null)}
        >
          <Typography>
            {removing.total_recursos === 0
              ? 'O bloco não tem recursos e será excluído.'
              : `O bloco tem ${resourcesLabel(removing.total_recursos)} e será desativado: todos somem da busca, e o histórico de reservas continua.`}
          </Typography>
        </RemovalDialog>
      )}
    </>
  );
}

function FeaturesTab() {
  const { notify } = useFeedback();
  const query = useAdminFeatures();
  const [editing, setEditing] = useState<FeatureAdminRead | null | undefined>(undefined);
  const [removing, setRemoving] = useState<FeatureAdminRead | null>(null);

  const rows = query.data?.map((feature) => ({
    id: feature.id,
    title: feature.nome,
    details: <Typography variant="body2">{resourcesLabel(feature.total_recursos)}</Typography>,
    actions: (
      <>
        <Button
          variant="outlined"
          onClick={() => setEditing(feature)}
          aria-label={`Renomear ${feature.nome}`}
        >
          Renomear
        </Button>
        <Button
          variant="outlined"
          color="error"
          onClick={() => setRemoving(feature)}
          aria-label={`Excluir ${feature.nome}`}
        >
          Excluir
        </Button>
      </>
    ),
  }));

  return (
    <>
      <Stack direction="row" sx={{ justifyContent: 'flex-end', mb: 2 }}>
        <Button variant="contained" startIcon={<AddSharp />} onClick={() => setEditing(null)}>
          Nova característica
        </Button>
      </Stack>
      {loadFailure(query) ? (
        <LoadError error={loadFailure(query)} onRetry={() => void query.refetch()} />
      ) : rows?.length === 0 ? (
        <Box sx={{ border: 1, borderColor: 'divider', backgroundColor: 'background.paper', p: 3 }}>
          <Typography>
            Nenhuma característica cadastrada. Elas viram filtros na busca, como Projetor.
          </Typography>
        </Box>
      ) : (
        <RowList label="Características" rows={rows} />
      )}

      {editing !== undefined && (
        <FeatureFormDialog feature={editing} onClose={() => setEditing(undefined)} />
      )}
      {removing && (
        <RemovalDialog
          title={`Excluir ${removing.nome}?`}
          confirmLabel="Excluir característica"
          remove={() => adminCatalogApi.removeFeature(removing.id)}
          onRemoved={() => {
            notify({ message: `Excluímos ${removing.nome}.`, severity: 'success' });
            setRemoving(null);
          }}
          onClose={() => setRemoving(null)}
        >
          <Typography>
            {removing.total_recursos === 0
              ? 'Nenhum recurso usa esta característica.'
              : `Ela sai de ${resourcesLabel(removing.total_recursos)} e do filtro da busca. Não dá para desfazer.`}
          </Typography>
        </RemovalDialog>
      )}
    </>
  );
}

export default function AdminBuildingsPage() {
  const [params, setParams] = useSearchParams();
  const tab: TabValue = params.get('aba') === 'caracteristicas' ? 'caracteristicas' : 'blocos';

  return (
    <>
      <PageHeader
        title="Blocos e características"
        description="Onde ficam os recursos e os atributos usados nos filtros da busca."
        breadcrumbs={[
          { label: 'Administração', to: paths.admin },
          { label: 'Blocos e características' },
        ]}
      />
      <Tabs
        value={tab}
        onChange={(_event, value: TabValue) =>
          setParams(value === 'caracteristicas' ? { aba: value } : {}, { replace: true })
        }
        aria-label="Blocos e características"
        sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab value="blocos" label="Blocos" id="aba-blocos" aria-controls="painel-catalogo" />
        <Tab
          value="caracteristicas"
          label="Características"
          id="aba-caracteristicas"
          aria-controls="painel-catalogo"
        />
      </Tabs>
      <Box role="tabpanel" id="painel-catalogo" aria-labelledby={`aba-${tab}`}>
        {tab === 'blocos' ? <BuildingsTab /> : <FeaturesTab />}
      </Box>
    </>
  );
}
