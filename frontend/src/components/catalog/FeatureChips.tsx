import { styled } from '@mui/material/styles';

import type { FeatureRead } from '@/lib/api/types';
import { colors } from '@/theme/tokens';

// Estilos fixos, criados uma vez: a busca mostra dezenas destes rótulos, e o Chip do MUI
// (feito para ser clicável) custava caro no primeiro render do celular (#32).
const List = styled('ul')({
  display: 'flex',
  flexWrap: 'wrap',
  gap: 6,
  margin: 0,
  padding: 0,
  listStyle: 'none',
});

const Tag = styled('span')({
  display: 'inline-flex',
  alignItems: 'center',
  height: 24,
  padding: '0 8px',
  border: `1px solid ${colors.line}`,
  borderRadius: 2,
  color: colors.ink,
  fontSize: '0.8125rem',
  lineHeight: 1,
  whiteSpace: 'nowrap',
});

interface FeatureChipsProps {
  features: readonly FeatureRead[];
  label: string;
}

/** Características de um recurso como lista de rótulos (não clicáveis). */
export function FeatureChips({ features, label }: FeatureChipsProps) {
  if (features.length === 0) return null;
  return (
    <List aria-label={label}>
      {features.map((feature) => (
        <li key={feature.id}>
          <Tag>{feature.nome}</Tag>
        </li>
      ))}
    </List>
  );
}
