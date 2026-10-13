import Box from '@mui/material/Box';
import Button from '@mui/material/Button';

import { PageHeader } from '@/components/PageHeader';

/** Fallback do roteador para erros inesperados de renderização. */
export default function ErrorPage() {
  return (
    <Box component="main" sx={{ maxWidth: 560, mx: 'auto', px: 2, py: 8 }}>
      <PageHeader
        title="Algo deu errado"
        description="A página não carregou como deveria. Tente de novo; se o problema continuar, avise o suporte."
      />
      <Button variant="contained" onClick={() => window.location.reload()}>
        Tentar de novo
      </Button>
    </Box>
  );
}
