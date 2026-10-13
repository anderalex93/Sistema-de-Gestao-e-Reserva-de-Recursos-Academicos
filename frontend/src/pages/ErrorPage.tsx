import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import { Link as RouterLink } from 'react-router';

import { PageHeader } from '@/components/PageHeader';
import { paths } from '@/router/paths';

/** Conteúdo do erro inesperado, sem detalhe técnico (o erro fica no console e na telemetria). */
export function PageError() {
  return (
    <>
      <PageHeader
        title="Algo deu errado"
        description="A página não carregou como deveria. Tente de novo; se o problema continuar, avise a administração do campus."
      />
      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
        <Button variant="contained" onClick={() => window.location.reload()}>
          Tentar de novo
        </Button>
        <Button component={RouterLink} to={paths.home} variant="outlined" reloadDocument>
          Ir para o início
        </Button>
      </Stack>
    </>
  );
}

/** Fallback da raiz do roteador: quando nem o layout do app conseguiu renderizar. */
export default function ErrorPage() {
  return (
    <Box component="main" sx={{ maxWidth: 560, mx: 'auto', px: 2, py: 8 }}>
      <PageError />
    </Box>
  );
}
