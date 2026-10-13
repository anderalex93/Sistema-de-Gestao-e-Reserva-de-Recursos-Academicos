import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import { Suspense } from 'react';
import { Outlet, Link as RouterLink } from 'react-router';

import { BrandMark } from '@/components/BrandMark';
import { PageSkeleton } from '@/components/PageSkeleton';
import { paths } from '@/router/paths';
import { colors, layout } from '@/theme/tokens';

/** Páginas sem navegação do app: login, cadastro, comprovante público e textos legais. */
export default function PublicLayout() {
  return (
    <Box sx={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <Box
        component="header"
        sx={{
          height: layout.topBarHeight,
          display: 'flex',
          alignItems: 'center',
          px: { xs: 2, md: 4 },
          backgroundColor: colors.surface,
          borderBottom: `1px solid ${colors.line}`,
        }}
      >
        <BrandMark />
      </Box>
      <Box
        component="main"
        sx={{ flex: 1, width: '100%', maxWidth: 560, mx: 'auto', px: 2, py: { xs: 4, md: 8 } }}
      >
        <Suspense fallback={<PageSkeleton />}>
          <Outlet />
        </Suspense>
      </Box>
      <Box
        component="footer"
        sx={{
          borderTop: `1px solid ${colors.line}`,
          backgroundColor: colors.surface,
          px: 2,
          py: 2,
        }}
      >
        <Stack
          component="nav"
          aria-label="Rodapé"
          direction="row"
          spacing={3}
          sx={{ justifyContent: 'center', fontSize: '0.875rem' }}
        >
          <Link component={RouterLink} to={paths.terms} color="text.secondary">
            Termos de Uso
          </Link>
          <Link component={RouterLink} to={paths.privacy} color="text.secondary">
            Aviso de Privacidade
          </Link>
        </Stack>
      </Box>
    </Box>
  );
}
