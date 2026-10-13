import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';

import { PageHeader } from '@/components/PageHeader';

export interface LegalSection {
  title: string;
  body: ReactNode;
}

interface LegalDocumentProps {
  title: string;
  description: string;
  /** "13/10/2026": quando o texto mudou pela última vez. */
  updatedAt: string;
  sections: readonly LegalSection[];
}

/** Texto jurídico em seções numeradas, com data da versão (Aviso de Privacidade e Termos). */
export function LegalDocument({ title, description, updatedAt, sections }: LegalDocumentProps) {
  return (
    <>
      <PageHeader title={title} description={description} />
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Versão de {updatedAt}
      </Typography>
      <Stack component="ol" spacing={3} sx={{ m: 0, p: 0, listStyle: 'none' }}>
        {sections.map((section, index) => (
          <Box component="li" key={section.title}>
            <Typography variant="h2" sx={{ fontSize: '1.25rem', mb: 1 }}>
              {index + 1}. {section.title}
            </Typography>
            <Box sx={{ '& p': { m: 0, mb: 1 }, '& ul': { m: 0, mb: 1, pl: 3 } }}>
              {section.body}
            </Box>
          </Box>
        ))}
      </Stack>
    </>
  );
}
