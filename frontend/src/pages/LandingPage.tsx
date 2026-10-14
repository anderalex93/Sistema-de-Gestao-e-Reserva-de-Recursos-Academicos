import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';
import { Link as RouterLink } from 'react-router';

import receiptCapture from '@/assets/landing/comprovante.png';
import gridCapture from '@/assets/landing/grade.png';
import { FaqList } from '@/components/public/FaqList';
import { mainFaq, product, steps } from '@/content/public-content';
import { paths } from '@/router/paths';
import { fullTitle, seoPageFor } from '@/seo/public-seo';
import { touchTarget } from '@/theme/patterns';
import { colors, fonts, layout, zIndex } from '@/theme/tokens';

// Dimensões reais das capturas (feitas com densidade 2x), para reservar o espaço e não haver
// salto de layout quando a imagem chega.
const GRID = { width: 480, height: 345 };
const RECEIPT = { width: 358, height: 777 };

const CTA_LABEL = 'Entrar com e-mail institucional';
const LANDING_TITLE = seoPageFor('/')?.title ?? 'Início';

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <Box
      component="section"
      aria-labelledby={id}
      sx={{ borderTop: `1px solid ${colors.line}`, pt: { xs: 4, md: 6 }, mt: { xs: 4, md: 6 } }}
    >
      <Typography id={id} variant="h2" sx={{ mb: 2.5 }}>
        {title}
      </Typography>
      {children}
    </Box>
  );
}

function Capture({
  src,
  alt,
  size,
  caption,
  lazy = false,
}: {
  src: string;
  alt: string;
  size: { width: number; height: number };
  caption: string;
  lazy?: boolean;
}) {
  return (
    <Box component="figure" sx={{ m: 0 }}>
      <Box
        component="img"
        src={src}
        alt={alt}
        width={size.width}
        height={size.height}
        loading={lazy ? 'lazy' : 'eager'}
        decoding="async"
        sx={{
          display: 'block',
          width: '100%',
          maxWidth: size.width,
          height: 'auto',
          border: `1px solid ${colors.lineStrong}`,
        }}
      />
      <Typography component="figcaption" variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        {caption}
      </Typography>
    </Box>
  );
}

/** Início público (#47): o que é, como funciona e o próprio produto como vitrine. */
export default function LandingPage() {
  return (
    <>
      <title>{fullTitle(LANDING_TITLE)}</title>

      <Box
        component="section"
        aria-labelledby="landing-titulo"
        sx={{
          display: 'grid',
          gap: { xs: 4, md: 6 },
          gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) minmax(0, 480px)' },
          alignItems: 'center',
        }}
      >
        <Stack spacing={2.5}>
          <Typography variant="overline" component="p">
            Reserva de espaços da UMJ
          </Typography>
          <Typography
            id="landing-titulo"
            variant="h1"
            sx={{ fontSize: { xs: '2.125rem', md: '2.75rem' }, lineHeight: { xs: 1.18, md: 1.18 } }}
          >
            {product.titulo}
          </Typography>
          <Typography color="text.secondary" sx={{ maxWidth: '60ch' }}>
            {product.subtitulo}
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <Button component={RouterLink} to={paths.login} variant="contained">
              {CTA_LABEL}
            </Button>
            <Button component={RouterLink} to={paths.signup} variant="outlined">
              Criar conta
            </Button>
          </Stack>
        </Stack>
        <Capture
          src={gridCapture}
          alt="Grade de horários da Sala de estudo 204: das 17:00 às 21:00, com uma reserva da própria pessoa, um horário ocupado por outra pessoa e o intervalo das 19:30 às 20:30 selecionado."
          size={GRID}
          caption="Grade de horários da Sala de estudo 204. Captura do sistema."
        />
      </Box>

      <Section id="landing-como" title="Como funciona">
        <Box
          component="ol"
          sx={{
            m: 0,
            p: 0,
            listStyle: 'none',
            display: 'grid',
            gap: 2.5,
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
          }}
        >
          {steps.map((step, index) => (
            <Box component="li" key={step.titulo} sx={{ display: 'flex', gap: 2 }}>
              <Typography
                aria-hidden
                sx={{
                  fontFamily: fonts.data,
                  fontWeight: 500,
                  color: colors.primary,
                  minWidth: 24,
                }}
              >
                {String(index + 1).padStart(2, '0')}
              </Typography>
              <Box>
                <Typography sx={{ fontWeight: 700 }}>{step.titulo}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {step.detalhe}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Section>

      <Section id="landing-comprovante" title="O comprovante vai no bolso">
        <Box
          sx={{
            display: 'grid',
            gap: { xs: 3, md: 6 },
            gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) minmax(0, 358px)' },
            alignItems: 'start',
          }}
        >
          <Stack spacing={1.5} sx={{ maxWidth: '60ch' }}>
            <Typography>
              Cada reserva confirmada gera um comprovante com código e QR code. Quem confere a sala
              lê o código e vê na hora se a reserva vale, foi cancelada ou já terminou.
            </Typography>
            <Typography>
              O comprovante mostra só o primeiro nome de quem reservou. Os outros dados ficam com
              você e com a administração do campus.
            </Typography>
          </Stack>
          <Capture
            src={receiptCapture}
            alt="Comprovante de reserva no celular: situação confirmada, código, espaço, data, horário, primeiro nome de quem reservou e o QR code para conferência."
            size={RECEIPT}
            caption="Comprovante aberto no celular. Captura do sistema."
            lazy
          />
        </Box>
      </Section>

      <Section id="landing-perguntas" title="Perguntas frequentes">
        <FaqList items={mainFaq} />
        <Typography sx={{ mt: 1 }}>
          <Link component={RouterLink} to={paths.help} sx={touchTarget}>
            Mais respostas e contato do suporte na Ajuda
          </Link>
        </Typography>
      </Section>

      {/* No celular o caminho para entrar fica sempre à mão, sem rolar de volta ao topo. */}
      <Box
        sx={{
          display: { xs: 'block', md: 'none' },
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: zIndex.stickyBar,
          px: 2,
          py: 1.5,
          backgroundColor: colors.surface,
          borderTop: `1px solid ${colors.lineStrong}`,
        }}
      >
        <Button component={RouterLink} to={paths.login} variant="contained" fullWidth>
          {CTA_LABEL}
        </Button>
      </Box>
      <Box
        aria-hidden
        sx={{ display: { xs: 'block', md: 'none' }, height: layout.bottomNavHeight }}
      />
    </>
  );
}
