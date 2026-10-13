import Box from '@mui/material/Box';
import { Suspense } from 'react';
import { Outlet } from 'react-router';

import { BrandMark } from '@/components/BrandMark';
import { PageSkeleton } from '@/components/PageSkeleton';
import { colors, layout } from '@/theme/tokens';

/** Páginas sem navegação do app: login, cadastro e verificação pública de comprovante. */
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
    </Box>
  );
}
