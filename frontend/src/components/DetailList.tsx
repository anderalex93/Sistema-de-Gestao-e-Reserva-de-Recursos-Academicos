import Box from '@mui/material/Box';
import type { ReactNode } from 'react';

export interface DetailItem {
  label: string;
  value: ReactNode;
}

/** Pares rótulo/valor (design system: comprovante, resumo, dados da conta). */
export function DetailList({ items }: { items: readonly DetailItem[] }) {
  return (
    <Box
      component="dl"
      sx={{
        m: 0,
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'max-content 1fr' },
        columnGap: 3,
        rowGap: { xs: 0.25, sm: 1.25 },
      }}
    >
      {items.map((item) => (
        <Box key={item.label} sx={{ display: 'contents' }}>
          <Box component="dt" sx={{ color: 'text.secondary', mt: { xs: 1.25, sm: 0 } }}>
            {item.label}
          </Box>
          <Box component="dd" sx={{ m: 0, fontWeight: 500, minWidth: 0, overflowWrap: 'anywhere' }}>
            {item.value}
          </Box>
        </Box>
      ))}
    </Box>
  );
}
