import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';

import { PageHeader } from '@/components/PageHeader';
import { FaqList } from '@/components/public/FaqList';
import { config } from '@/config';
import { helpFaq, supportResponseTime } from '@/content/public-content';

const panelSx = { border: 1, borderColor: 'divider', backgroundColor: 'background.paper', p: 3 };

export default function HelpPage() {
  return (
    <>
      <PageHeader
        title="Ajuda"
        description="Respostas rápidas sobre reservas e como falar com o suporte."
      />
      <Box component="section" aria-labelledby="ajuda-perguntas" sx={{ mb: 4 }}>
        <Typography id="ajuda-perguntas" variant="h2" sx={{ mb: 1.5 }}>
          Perguntas frequentes
        </Typography>
        <FaqList items={helpFaq} open />
      </Box>
      <Box component="section" aria-labelledby="ajuda-suporte" sx={panelSx}>
        <Typography id="ajuda-suporte" variant="h3" component="h2" sx={{ mb: 1 }}>
          Fale com o suporte
        </Typography>
        {config.supportEmail ? (
          <>
            <Typography sx={{ mb: 0.5 }}>
              Escreva para <Link href={`mailto:${config.supportEmail}`}>{config.supportEmail}</Link>{' '}
              contando o que aconteceu e, se for o caso, o código do comprovante.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {supportResponseTime}
            </Typography>
          </>
        ) : (
          <Typography>
            Procure a administração do campus da UMJ, na secretaria do seu bloco, com o código do
            comprovante em mãos se a dúvida for sobre uma reserva.
          </Typography>
        )}
      </Box>
    </>
  );
}
