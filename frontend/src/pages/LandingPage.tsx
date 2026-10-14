import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';
import { Link as RouterLink } from 'react-router';

import gridCapture from '@/assets/landing/grade.png';
import { FaqList } from '@/components/public/FaqList';
import {
  checkinStory,
  facts,
  headlineEmphasis,
  mainFaq,
  product,
  steps,
} from '@/content/public-content';
import { paths } from '@/router/paths';
import { fullTitle, seoPageFor } from '@/seo/public-seo';
import { touchTarget } from '@/theme/patterns';
import { colors, fonts, layout, zIndex } from '@/theme/tokens';

// Dimensões reais da captura (feita com densidade 2x), para reservar o espaço e não haver
// salto de layout quando a imagem chega.
const GRID = { width: 480, height: 345 };

const CTA_LABEL = 'Entrar com e-mail institucional';
const LANDING_TITLE = seoPageFor('/')?.title ?? 'Início';

/** Número grande das seções editoriais: Literata no tamanho do h1, em azul. */
const bigNumber = {
  fontFamily: fonts.display,
  fontWeight: 500,
  fontSize: '2rem',
  lineHeight: 1.25,
  color: colors.primary,
  fontVariantNumeric: 'tabular-nums',
} as const;

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <Box
      component="section"
      aria-labelledby={id}
      sx={{ borderTop: `1px solid ${colors.line}`, pt: { xs: 4, md: 6 }, mt: { xs: 6, md: 8 } }}
    >
      <Typography id={id} variant="h2" sx={{ mb: { xs: 3, md: 4 } }}>
        {title}
      </Typography>
      {children}
    </Box>
  );
}

/** Título com o fim em itálico, sem mudar o texto lido por leitores de tela e buscadores. */
function Headline() {
  const { titulo } = product;
  const cut = titulo.endsWith(headlineEmphasis) ? titulo.length - headlineEmphasis.length : -1;
  return (
    <Typography
      id="landing-titulo"
      variant="h1"
      sx={{ fontSize: { xs: '2.125rem', md: '2.75rem' }, lineHeight: 1.18, textWrap: 'balance' }}
    >
      {cut < 0 ? (
        titulo
      ) : (
        <>
          {titulo.slice(0, cut)}
          <Box
            component="em"
            sx={{ fontStyle: 'italic', color: colors.primary, whiteSpace: 'nowrap' }}
          >
            {headlineEmphasis}
          </Box>
        </>
      )}
    </Typography>
  );
}

function Facts() {
  return (
    <Box
      component="dl"
      sx={{
        m: 0,
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        borderTop: `1px solid ${colors.line}`,
        pt: 2.5,
      }}
    >
      {facts.map((fact, index) => (
        <Box
          key={fact.valor + fact.rotulo}
          sx={{
            pr: { xs: 1.5, sm: 2.5 },
            pl: index === 0 ? 0 : { xs: 1.5, sm: 2.5 },
            borderLeft: index === 0 ? 'none' : `1px solid ${colors.line}`,
            display: 'flex',
            flexDirection: 'column-reverse',
            justifyContent: 'flex-end',
            gap: 0.5,
          }}
        >
          <Typography component="dt" variant="body2" color="text.secondary">
            {fact.rotulo}
          </Typography>
          <Typography
            component="dd"
            sx={{
              ...bigNumber,
              fontSize: { xs: '1.5rem', sm: '2rem' },
              m: 0,
              whiteSpace: 'nowrap',
            }}
          >
            {fact.valor}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

/** A captura como uma folha: cabeçalho de documento, imagem e legenda. */
function GridSheet() {
  return (
    <Box component="figure" sx={{ m: 0, width: '100%', maxWidth: GRID.width, justifySelf: 'end' }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 2,
          px: 2,
          py: 1.25,
          border: `1px solid ${colors.lineStrong}`,
          borderBottom: 'none',
          backgroundColor: colors.ink,
          color: colors.paper,
          fontFamily: fonts.data,
          fontSize: '0.875rem',
          lineHeight: 1.43,
        }}
      >
        <span>Sala de estudo 204</span>
        <Box component="span" sx={{ color: colors.hatch }}>
          Bloco A
        </Box>
      </Box>
      <Box
        component="img"
        src={gridCapture}
        alt="Grade de horários da Sala de estudo 204: das 17:00 às 21:00, com uma reserva da própria pessoa, um horário ocupado por outra pessoa e o intervalo das 19:30 às 20:30 selecionado."
        width={GRID.width}
        height={GRID.height}
        loading="eager"
        decoding="async"
        sx={{
          display: 'block',
          width: '100%',
          height: 'auto',
          border: `1px solid ${colors.lineStrong}`,
        }}
      />
      <Typography component="figcaption" variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        Grade de horários da Sala de estudo 204. Captura do sistema.
      </Typography>
    </Box>
  );
}

function Steps() {
  return (
    <Box
      component="ol"
      sx={{
        m: 0,
        p: 0,
        listStyle: 'none',
        display: 'grid',
        gap: { xs: 0, md: 3 },
        gridTemplateColumns: { xs: '1fr', md: 'repeat(4, minmax(0, 1fr))' },
      }}
    >
      {steps.map((step, index) => (
        <Box
          component="li"
          key={step.titulo}
          sx={{
            display: 'flex',
            flexDirection: { xs: 'row', md: 'column' },
            gap: { xs: 2, md: 1.5 },
            py: { xs: 2, md: 0 },
            pt: { md: 2 },
            borderTop: { xs: index === 0 ? 'none' : `1px solid ${colors.line}`, md: 'none' },
            position: 'relative',
            // No desktop, um fio contínuo liga os quatro passos como uma linha do tempo.
            '&::before': {
              content: '""',
              display: { xs: 'none', md: 'block' },
              position: 'absolute',
              top: 0,
              left: 0,
              right: { md: index === steps.length - 1 ? 0 : -24 },
              borderTop: `2px solid ${colors.ink}`,
            },
          }}
        >
          <Typography aria-hidden sx={{ ...bigNumber, minWidth: 40 }}>
            {String(index + 1).padStart(2, '0')}
          </Typography>
          <Box>
            <Typography sx={{ fontWeight: 700 }}>{step.titulo}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {step.detalhe}
            </Typography>
          </Box>
        </Box>
      ))}
    </Box>
  );
}

function splitAfterQuestion(text: string): [string, string] {
  const at = text.indexOf('? ');
  return at < 0 ? [text, ''] : [text.slice(0, at + 1), text.slice(at + 2)];
}

/** Check-in pela porta (#43): faixa marinho com a linha do tempo de uma reserva de exemplo. */
function CheckinBand() {
  // A pergunta numa linha e a resposta na outra, em vez de quebrar no meio de uma frase.
  const [question, answer] = splitAfterQuestion(checkinStory.titulo);
  return (
    <Box
      component="section"
      aria-labelledby="landing-checkin"
      sx={{
        mt: { xs: 6, md: 8 },
        mx: { xs: -2, md: 0 },
        px: { xs: 2, sm: 4, md: 6 },
        py: { xs: 5, md: 7 },
        backgroundColor: colors.ink,
        color: colors.paper,
        display: 'grid',
        gap: { xs: 4, md: 6 },
        gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 5fr) minmax(0, 7fr)' },
      }}
    >
      <Stack spacing={2}>
        <Box aria-hidden sx={{ width: 32, height: 4, backgroundColor: colors.brandAccent }} />
        <Typography id="landing-checkin" variant="h2" sx={{ color: colors.paper }}>
          {question}{' '}
          <Box component="span" sx={{ display: 'block' }}>
            {answer}
          </Box>
        </Typography>
        <Typography sx={{ color: colors.hatch, maxWidth: '50ch' }}>{checkinStory.texto}</Typography>
      </Stack>
      <Box>
        <Typography
          sx={{ fontFamily: fonts.data, fontSize: '0.875rem', color: colors.hatch, mb: 2.5 }}
        >
          {checkinStory.exemplo}
        </Typography>
        <Box
          component="ol"
          sx={{
            m: 0,
            p: 0,
            listStyle: 'none',
            display: 'grid',
            gap: { xs: 0, sm: 3 },
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' },
            borderTop: { sm: `1px solid ${colors.lineStrong}` },
          }}
        >
          {checkinStory.marcos.map((marco, index) => {
            const last = index === checkinStory.marcos.length - 1;
            return (
              <Box
                component="li"
                key={marco.hora}
                sx={{
                  position: 'relative',
                  pt: { xs: 0, sm: 2.5 },
                  pb: { xs: last ? 0 : 3, sm: 0 },
                  pl: { xs: 3, sm: 0 },
                  borderLeft: { xs: `1px solid ${colors.lineStrong}`, sm: 'none' },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    width: 9,
                    height: 9,
                    left: { xs: -5, sm: 0 },
                    top: { xs: 6, sm: -5 },
                    backgroundColor: last ? colors.brandAccent : colors.paper,
                  },
                }}
              >
                <Typography
                  sx={{
                    fontFamily: fonts.data,
                    fontWeight: 500,
                    fontSize: '1.5rem',
                    lineHeight: 1.33,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {marco.hora}
                </Typography>
                <Typography sx={{ fontWeight: 700, mt: 0.5 }}>{marco.titulo}</Typography>
                <Typography variant="body2" sx={{ color: colors.hatch, mt: 0.5 }}>
                  {marco.detalhe}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}

/** Início público (#47): o que é, como funciona e o próprio produto como vitrine. */
export default function LandingPage() {
  return (
    <Box
      sx={{
        // Quebra de linha cuidada em toda a página: títulos equilibrados e nenhum parágrafo
        // terminando com uma palavra sozinha.
        '& h1, & h2, & h3': { textWrap: 'balance' },
        '& p, & li, & dd, & summary': { textWrap: 'pretty' },
      }}
    >
      <title>{fullTitle(LANDING_TITLE)}</title>

      <Box
        component="section"
        aria-labelledby="landing-titulo"
        sx={{
          display: 'grid',
          gap: { xs: 5, md: 8 },
          gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 7fr) minmax(0, 5fr)' },
          alignItems: 'center',
          pt: { md: 2 },
        }}
      >
        <Stack spacing={3}>
          <Typography variant="overline" component="p">
            Reserva de espaços da UMJ
          </Typography>
          <Headline />
          <Typography color="text.secondary" sx={{ maxWidth: '52ch' }}>
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
          <Box sx={{ pt: 1 }}>
            <Facts />
          </Box>
        </Stack>
        <GridSheet />
      </Box>

      <Section id="landing-como" title="Como funciona">
        <Steps />
      </Section>

      <CheckinBand />

      <Box
        component="section"
        aria-labelledby="landing-perguntas"
        sx={{
          borderTop: `1px solid ${colors.line}`,
          pt: { xs: 4, md: 6 },
          mt: { xs: 6, md: 8 },
          display: 'grid',
          gap: { xs: 3, md: 6 },
          gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 4fr) minmax(0, 8fr)' },
          alignItems: 'start',
        }}
      >
        <Stack spacing={1.5} sx={{ pt: { md: 1 } }}>
          <Typography id="landing-perguntas" variant="h2">
            Perguntas frequentes
          </Typography>
          <Typography color="text.secondary" sx={{ maxWidth: '36ch' }}>
            O essencial sobre quem reserva, prazos e o comprovante.
          </Typography>
          <Typography>
            <Link component={RouterLink} to={paths.help} sx={touchTarget}>
              Ver todas as perguntas na Ajuda
            </Link>
          </Typography>
        </Stack>
        <FaqList items={mainFaq} />
      </Box>

      <Box
        component="section"
        aria-labelledby="landing-fim"
        sx={{
          mt: { xs: 6, md: 8 },
          py: { xs: 4, md: 5 },
          borderTop: `2px solid ${colors.ink}`,
          borderBottom: `1px solid ${colors.line}`,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { md: 'center' },
          justifyContent: 'space-between',
          gap: 3,
        }}
      >
        <Box>
          <Typography id="landing-fim" variant="h2">
            Comece pela grade de hoje.
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            Entre com o e-mail da UMJ e veja o que está livre agora.
          </Typography>
        </Box>
        <Button
          component={RouterLink}
          to={paths.login}
          variant="contained"
          sx={{ display: { xs: 'none', md: 'inline-flex' }, flexShrink: 0 }}
        >
          {CTA_LABEL}
        </Button>
      </Box>

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
    </Box>
  );
}
