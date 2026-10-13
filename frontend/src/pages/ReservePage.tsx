import Box from '@mui/material/Box';
import Pagination from '@mui/material/Pagination';
import Typography from '@mui/material/Typography';
import { useState } from 'react';

import { ResourceCard, ResourceCardSkeleton } from '@/components/catalog/ResourceCard';
import { LoadError } from '@/components/LoadError';
import { PageHeader } from '@/components/PageHeader';
import { useResourceList } from '@/hooks/useCatalog';

const PER_PAGE = 24;

const gridSx = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
  gap: 2,
  m: 0,
  p: 0,
  listStyle: 'none',
} as const;

export default function ReservePage() {
  const [page, setPage] = useState(1);
  const query = useResourceList({ page, per_page: PER_PAGE });
  const data = query.data;

  return (
    <>
      <PageHeader
        title="Reservar espaço"
        description="Escolha uma sala, laboratório, auditório ou equipamento para ver os detalhes."
      />

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
            {data && data.total > 0 && `${data.total} ${data.total === 1 ? 'recurso' : 'recursos'}`}
          </Typography>

          {data?.total === 0 ? (
            <Box
              sx={{ border: 1, borderColor: 'divider', backgroundColor: 'background.paper', p: 3 }}
            >
              <Typography>
                Nenhum espaço ou equipamento está disponível para reserva no momento. Fale com a
                administração do campus.
              </Typography>
            </Box>
          ) : (
            <Box component="ul" aria-label="Recursos" aria-busy={query.isPending} sx={gridSx}>
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
              page={page}
              onChange={(_event, next) => {
                setPage(next);
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
