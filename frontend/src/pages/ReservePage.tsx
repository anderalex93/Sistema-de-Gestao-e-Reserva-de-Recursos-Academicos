import CloseSharp from '@mui/icons-material/CloseSharp';
import TuneSharp from '@mui/icons-material/TuneSharp';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Pagination from '@mui/material/Pagination';
import Stack from '@mui/material/Stack';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import dayjs from 'dayjs';
import { useState } from 'react';

import { ResourceCard, ResourceCardSkeleton } from '@/components/catalog/ResourceCard';
import { SearchFiltersForm } from '@/components/catalog/SearchFiltersForm';
import { LoadError } from '@/components/LoadError';
import { PageHeader } from '@/components/PageHeader';
import {
  activeFilterCount,
  hasTimeWindow,
  toApiParams,
  type ResourceSearch,
} from '@/domain/resource-search';
import { useBuildings, useFeatures, useResourceList } from '@/hooks/useCatalog';
import { useResourceSearch } from '@/hooks/useResourceSearch';
import { colors, zIndex } from '@/theme/tokens';

const PER_PAGE = 24;

const gridSx = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
  gap: 2,
  m: 0,
  p: 0,
  listStyle: 'none',
} as const;

const panelSx = { border: 1, borderColor: 'divider', backgroundColor: 'background.paper' };

function resultSummary(total: number, search: ResourceSearch): string {
  const count = `${total} ${total === 1 ? 'recurso' : 'recursos'}`;
  if (!hasTimeWindow(search)) return count;
  const day = dayjs(search.data).locale('pt-br').format('ddd, D [de] MMM');
  const free = total === 1 ? 'livre' : 'livres';
  return `${count} ${free} em ${day}, ${search.inicio} às ${search.fim}`;
}

export default function ReservePage() {
  const theme = useTheme();
  const compact = useMediaQuery(theme.breakpoints.down('md'));
  const { search, update, goToPage, clear } = useResourceSearch();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const query = useResourceList(toApiParams(search, PER_PAGE));
  const buildings = useBuildings();
  const features = useFeatures();
  const data = query.data;
  const filters = activeFilterCount(search);

  const form = (
    <SearchFiltersForm
      search={search}
      onChange={update}
      buildings={buildings.data ?? []}
      features={features.data ?? []}
    />
  );
  const clearButton = filters > 0 && (
    <Button variant="text" onClick={clear}>
      Limpar filtros
    </Button>
  );

  return (
    <>
      <PageHeader
        title="Reservar espaço"
        description="Filtre por bloco, tipo, recursos e horário para encontrar um espaço livre."
      />

      {compact ? (
        <Stack direction="row" spacing={1} sx={{ mb: 2, alignItems: 'center' }}>
          <Button
            variant="outlined"
            startIcon={<TuneSharp />}
            onClick={() => setDrawerOpen(true)}
            aria-haspopup="dialog"
          >
            {filters > 0 ? `Filtrar (${filters})` : 'Filtrar'}
          </Button>
          {clearButton}
        </Stack>
      ) : (
        <Box component="section" aria-label="Filtros" sx={{ ...panelSx, p: 3, mb: 3 }}>
          {form}
          {clearButton && <Box sx={{ mt: 2 }}>{clearButton}</Box>}
        </Box>
      )}

      <Drawer
        anchor="bottom"
        open={compact && drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{ zIndex: zIndex.dialog }}
        slotProps={{
          paper: {
            role: 'dialog',
            'aria-label': 'Filtros',
            sx: { maxHeight: '90dvh', borderTop: `1px solid ${colors.lineStrong}` },
          },
        }}
      >
        <Stack
          direction="row"
          sx={{
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2,
            py: 1,
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Typography variant="h3" component="h2">
            Filtros
          </Typography>
          <IconButton aria-label="Fechar filtros" onClick={() => setDrawerOpen(false)}>
            <CloseSharp />
          </IconButton>
        </Stack>
        <Box sx={{ p: 2, overflowY: 'auto' }}>{form}</Box>
        <Stack
          direction="row"
          spacing={1}
          sx={{ p: 2, borderTop: 1, borderColor: 'divider', justifyContent: 'space-between' }}
        >
          {clearButton || <span />}
          <Button variant="contained" onClick={() => setDrawerOpen(false)}>
            {data
              ? `Ver ${data.total} ${data.total === 1 ? 'resultado' : 'resultados'}`
              : 'Ver resultados'}
          </Button>
        </Stack>
      </Drawer>

      {query.isError && !data ? (
        <LoadError error={query.error} onRetry={() => void query.refetch()} />
      ) : (
        <>
          <Typography
            variant="body2"
            color="text.secondary"
            aria-live="polite"
            sx={{ mb: 1.5, minHeight: 22 }}
          >
            {data && resultSummary(data.total, search)}
          </Typography>

          {data?.total === 0 ? (
            <Box sx={{ ...panelSx, p: 3 }}>
              {filters > 0 ? (
                <>
                  <Typography>Nenhum recurso atende a esses filtros.</Typography>
                  <Button variant="outlined" sx={{ mt: 2 }} onClick={clear}>
                    Limpar filtros
                  </Button>
                </>
              ) : (
                <Typography>
                  Nenhum espaço ou equipamento está disponível para reserva no momento. Fale com a
                  administração do campus.
                </Typography>
              )}
            </Box>
          ) : (
            <Box
              component="ul"
              aria-label="Recursos"
              aria-busy={query.isPending || query.isPlaceholderData}
              sx={gridSx}
            >
              {data
                ? data.items.map((resource) => (
                    <li key={resource.id}>
                      <ResourceCard resource={resource} />
                    </li>
                  ))
                : Array.from({ length: 6 }, (_, index) => (
                    <li key={index}>
                      <ResourceCardSkeleton />
                    </li>
                  ))}
            </Box>
          )}

          {data && data.total_pages > 1 && (
            <Pagination
              count={data.total_pages}
              page={search.page}
              onChange={(_event, next) => {
                goToPage(next);
                window.scrollTo({ top: 0 });
              }}
              shape="rounded"
              variant="outlined"
              getItemAriaLabel={(type, item) =>
                type === 'page'
                  ? `Página ${item ?? ''}`
                  : type === 'next'
                    ? 'Próxima página'
                    : type === 'previous'
                      ? 'Página anterior'
                      : type
              }
              sx={{ mt: 3, '& ul': { justifyContent: 'center' } }}
            />
          )}
        </>
      )}
    </>
  );
}
