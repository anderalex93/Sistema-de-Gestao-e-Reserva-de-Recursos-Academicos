import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';

/** Esqueleto exibido enquanto o código de uma página é carregado. */
export function PageSkeleton() {
  return (
    <Stack spacing={1.5} aria-busy="true" aria-label="Carregando página">
      <Skeleton variant="rectangular" width={220} height={36} />
      <Skeleton variant="rectangular" width="60%" height={20} />
      <Skeleton variant="rectangular" height={120} sx={{ mt: 2 }} />
    </Stack>
  );
}
