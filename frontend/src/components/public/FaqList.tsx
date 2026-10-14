import { styled } from '@mui/material/styles';

import type { FaqItem } from '@/content/public-content';
import { colors } from '@/theme/tokens';

// `details` nativo: abre com Enter ou Espaço, é lido como expansível e funciona sem JavaScript
// na versão pré-renderizada (#48).
const Item = styled('details')({
  borderTop: `1px solid ${colors.line}`,
  '&:last-of-type': { borderBottom: `1px solid ${colors.line}` },
  '& > summary': {
    display: 'flex',
    alignItems: 'center',
    minHeight: 44,
    padding: '10px 0',
    cursor: 'pointer',
    fontWeight: 700,
  },
  '& > p': { margin: '0 0 16px', maxWidth: '65ch', color: colors.inkMuted },
});

interface FaqListProps {
  items: readonly FaqItem[];
  /** Ajuda: tudo aberto, para ler de uma vez e achar com Ctrl+F. */
  open?: boolean;
}

export function FaqList({ items, open = false }: FaqListProps) {
  return (
    <div>
      {items.map((item) => (
        <Item key={item.pergunta} open={open}>
          <summary>{item.pergunta}</summary>
          <p>{item.resposta}</p>
        </Item>
      ))}
    </div>
  );
}
