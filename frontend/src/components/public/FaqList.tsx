import AddSharp from '@mui/icons-material/AddSharp';
import RemoveSharp from '@mui/icons-material/RemoveSharp';
import { styled } from '@mui/material/styles';

import type { FaqItem } from '@/content/public-content';
import { colors } from '@/theme/tokens';

// `details` nativo: abre com Enter ou Espaço, é lido como expansível e funciona sem JavaScript
// na versão pré-renderizada (#48). O sinal de mais ou menos só mostra o estado; quem anuncia
// aberto e fechado é o próprio `details`.
const Item = styled('details')({
  borderTop: `1px solid ${colors.line}`,
  '&:last-of-type': { borderBottom: `1px solid ${colors.line}` },
  '& > summary': {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    minHeight: 56,
    padding: '12px 0',
    cursor: 'pointer',
    fontWeight: 700,
    listStyle: 'none',
  },
  '& > summary::-webkit-details-marker': { display: 'none' },
  '& > summary:hover': { color: colors.primary },
  '& .faq-icon': { flexShrink: 0, fontSize: 20, color: colors.primary },
  '& .faq-icon-close, &[open] .faq-icon-open': { display: 'none' },
  '&[open] .faq-icon-close': { display: 'block' },
  '& > p': { margin: '0 0 20px', maxWidth: '65ch', color: colors.inkMuted },
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
          <summary>
            <span>{item.pergunta}</span>
            <AddSharp aria-hidden className="faq-icon faq-icon-open" />
            <RemoveSharp aria-hidden className="faq-icon faq-icon-close" />
          </summary>
          <p>{item.resposta}</p>
        </Item>
      ))}
    </div>
  );
}
