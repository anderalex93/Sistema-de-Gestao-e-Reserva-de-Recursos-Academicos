import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import { Link as RouterLink } from 'react-router';

import { PageHeader } from '@/components/PageHeader';
import { paths } from '@/router/paths';

export default function NotFoundPage() {
  return (
    <>
      <PageHeader
        title="Página não encontrada"
        overline="Erro 404"
        description="O endereço pode ter sido digitado errado ou a página mudou de lugar."
      />
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
        <Button component={RouterLink} to={paths.home} variant="contained">
          Ir para o início
        </Button>
        <Button component={RouterLink} to={paths.reserve} variant="outlined">
          Reservar espaço
        </Button>
      </Stack>
    </>
  );
}
