import AddSharp from '@mui/icons-material/AddSharp';
import SearchSharp from '@mui/icons-material/SearchSharp';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import OutlinedInput from '@mui/material/OutlinedInput';
import Select from '@mui/material/Select';
import { useTheme } from '@mui/material/styles';
import TablePagination from '@mui/material/TablePagination';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useId, useState, type ReactNode } from 'react';

import { RemovalDialog } from '@/components/admin/RemovalDialog';
import { ResourceFormDialog } from '@/components/admin/ResourceFormDialog';
import { ResourceList, ResourceTable } from '@/components/admin/ResourceAdminViews';
import { LoadError } from '@/components/LoadError';
import { PageHeader } from '@/components/PageHeader';
import { removalMessage } from '@/domain/catalog-admin';
import { resourceTypeLabels } from '@/domain/resource-types';
import {
  useAdminBuildings,
  useAdminFeatures,
  useAdminResources,
  useCatalogMutation,
} from '@/hooks/useAdminCatalog';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useFeedback } from '@/hooks/useFeedback';
import { adminCatalogApi } from '@/lib/api';
import type { AdminResourceListParams } from '@/lib/api/admin-catalog.api';
import { ApiError } from '@/lib/api/api-error';
import type { ResourceAdminRead, ResourceType } from '@/lib/api/types';
import { paths } from '@/router/paths';

const ANY = '';
const labelSx = { mb: 0.75, fontWeight: 700, fontSize: '0.875rem', color: 'text.primary' };

type Situation = typeof ANY | 'ativos' | 'desativados';

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

export default function AdminResourcesPage() {
  const id = useId();
  const theme = useTheme();
  const compact = useMediaQuery(theme.breakpoints.down('md'));
  const { notify } = useFeedback();

  const [search, setSearch] = useState('');
  const [blocoId, setBlocoId] = useState(ANY);
  const [tipo, setTipo] = useState<ResourceType | typeof ANY>(ANY);
  const [situation, setSituation] = useState<Situation>(ANY);
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(20);
  // `undefined`: nenhum formulário aberto; `null`: recurso novo.
  const [editing, setEditing] = useState<ResourceAdminRead | null | undefined>(undefined);
  const [removing, setRemoving] = useState<ResourceAdminRead | null>(null);
  const busca = useDebouncedValue(search.trim());

  const params: AdminResourceListParams = {
    page: page + 1,
    per_page: perPage,
    ...(busca ? { busca } : {}),
    ...(blocoId ? { bloco_id: Number(blocoId) } : {}),
    ...(tipo ? { tipo } : {}),
    ...(situation ? { ativo: situation === 'ativos' } : {}),
  };
  const query = useAdminResources(params);
  const buildings = useAdminBuildings();
  const features = useAdminFeatures();
  const filtered = Boolean(busca || blocoId || tipo || situation);

  const reactivate = useCatalogMutation((resource: ResourceAdminRead) =>
    adminCatalogApi.reactivateResource(resource.id),
  );
  const reactivatingId = reactivate.isPending ? (reactivate.variables?.id ?? null) : null;

  const changeFilter =
    <Value,>(set: (value: Value) => void) =>
    (value: Value) => {
      set(value);
      setPage(0);
    };

  const actions = {
    onEdit: setEditing,
    onRemove: setRemoving,
    onReactivate: (resource: ResourceAdminRead) =>
      reactivate.mutate(resource, {
        onSuccess: (saved) =>
          notify({
            message: `Reativamos ${saved.nome}. Voltou para a busca.`,
            severity: 'success',
          }),
        onError: (error) => notify({ message: ApiError.from(error).message, severity: 'error' }),
      }),
    reactivatingId,
  };
  const formReady = buildings.data !== undefined && features.data !== undefined;

  return (
    <>
      <PageHeader
        title="Recursos"
        description="Salas, laboratórios, auditórios e equipamentos que podem ser reservados."
        breadcrumbs={[{ label: 'Administração', to: paths.admin }, { label: 'Recursos' }]}
        actions={
          <Button
            variant="contained"
            startIcon={<AddSharp />}
            onClick={() => setEditing(null)}
            disabled={!formReady}
          >
            Novo recurso
          </Button>
        }
      />

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          mb: 2,
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 140px), 1fr))',
        }}
      >
        <Filter id={`${id}-busca`} label="Nome">
          <OutlinedInput
            id={`${id}-busca`}
            value={search}
            onChange={(event) => changeFilter(setSearch)(event.target.value)}
            placeholder="Ex.: Sala 204"
            startAdornment={
              <InputAdornment position="start">
                <SearchSharp aria-hidden />
              </InputAdornment>
            }
          />
        </Filter>
        <Filter id={`${id}-bloco`} label="Bloco">
          <Select
            id={`${id}-bloco`}
            labelId={`${id}-bloco-rotulo`}
            value={blocoId}
            onChange={(event) => changeFilter(setBlocoId)(event.target.value)}
            displayEmpty
          >
            <MenuItem value={ANY}>Todos os blocos</MenuItem>
            {buildings.data?.map((building) => (
              <MenuItem key={building.id} value={String(building.id)}>
                {building.ativo ? building.nome : `${building.nome} (desativado)`}
              </MenuItem>
            ))}
          </Select>
        </Filter>
        <Filter id={`${id}-tipo`} label="Tipo">
          <Select
            id={`${id}-tipo`}
            labelId={`${id}-tipo-rotulo`}
            value={tipo}
            onChange={(event) =>
              changeFilter(setTipo)(event.target.value as ResourceType | typeof ANY)
            }
            displayEmpty
          >
            <MenuItem value={ANY}>Todos os tipos</MenuItem>
            {Object.entries(resourceTypeLabels).map(([value, label]) => (
              <MenuItem key={value} value={value}>
                {label}
              </MenuItem>
            ))}
          </Select>
        </Filter>
        <Filter id={`${id}-situacao`} label="Situação">
          <Select
            id={`${id}-situacao`}
            labelId={`${id}-situacao-rotulo`}
            value={situation}
            onChange={(event) => changeFilter(setSituation)(event.target.value as Situation)}
            displayEmpty
          >
            <MenuItem value={ANY}>Todas</MenuItem>
            <MenuItem value="ativos">Só ativos</MenuItem>
            <MenuItem value="desativados">Só desativados</MenuItem>
          </Select>
        </Filter>
      </Box>

      {query.isError && !query.data ? (
        <LoadError error={query.error} onRetry={() => void query.refetch()} />
      ) : query.data?.total === 0 ? (
        <Box sx={{ border: 1, borderColor: 'divider', backgroundColor: 'background.paper', p: 3 }}>
          <Typography>
            {filtered
              ? 'Nenhum recurso com estes filtros. Mude a busca ou os filtros.'
              : 'Nenhum recurso cadastrado ainda.'}
          </Typography>
          {!filtered && (
            <Button
              variant="outlined"
              sx={{ mt: 2 }}
              onClick={() => setEditing(null)}
              disabled={!formReady}
            >
              Cadastrar o primeiro recurso
            </Button>
          )}
        </Box>
      ) : (
        <Box sx={{ border: 1, borderColor: 'divider', backgroundColor: 'background.paper' }}>
          {compact ? (
            <ResourceList items={query.data?.items} {...actions} />
          ) : (
            <ResourceTable items={query.data?.items} {...actions} />
          )}
          <TablePagination
            component="div"
            count={query.data?.total ?? 0}
            page={page}
            onPageChange={(_event, next) => setPage(next)}
            rowsPerPage={perPage}
            onRowsPerPageChange={(event) => {
              setPerPage(Number(event.target.value));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 20, 50]}
            labelRowsPerPage="Por página"
            labelDisplayedRows={({ from, to, count }) => `${from} a ${to} de ${count}`}
            getItemAriaLabel={(type) =>
              type === 'next' ? 'Próxima página' : type === 'previous' ? 'Página anterior' : type
            }
          />
        </Box>
      )}

      {editing !== undefined && formReady && (
        <ResourceFormDialog
          resource={editing}
          buildings={buildings.data}
          features={features.data}
          onClose={() => setEditing(undefined)}
        />
      )}

      {removing && (
        <RemovalDialog
          title={`Remover ${removing.nome}?`}
          confirmLabel="Remover recurso"
          remove={(force) => adminCatalogApi.removeResource(removing.id, force)}
          onRemoved={(result) => {
            notify({ message: removalMessage(removing.nome, result), severity: 'success' });
            setRemoving(null);
          }}
          onClose={() => setRemoving(null)}
        >
          <Typography>
            Se o recurso nunca foi reservado, ele é excluído. Se já tem reservas, fica desativado:
            some da busca, e as reservas antigas e os comprovantes continuam valendo.
          </Typography>
        </RemovalDialog>
      )}
    </>
  );
}
