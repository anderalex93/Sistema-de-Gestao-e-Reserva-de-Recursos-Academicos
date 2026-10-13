import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';

import type { FeatureRead } from '@/lib/api/types';

interface FeatureChipsProps {
  features: readonly FeatureRead[];
  label: string;
}

/** Características de um recurso como lista de rótulos (não clicáveis). */
export function FeatureChips({ features, label }: FeatureChipsProps) {
  if (features.length === 0) return null;
  return (
    <Stack
      component="ul"
      aria-label={label}
      direction="row"
      useFlexGap
      sx={{ flexWrap: 'wrap', gap: 0.75, m: 0, p: 0, listStyle: 'none' }}
    >
      {features.map((feature) => (
        <li key={feature.id}>
          <Chip label={feature.nome} size="small" variant="outlined" />
        </li>
      ))}
    </Stack>
  );
}
