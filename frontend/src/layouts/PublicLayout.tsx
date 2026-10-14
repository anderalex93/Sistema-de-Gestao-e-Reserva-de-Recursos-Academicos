import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Suspense } from 'react';
import { Outlet, Link as RouterLink, useLocation, useMatches } from 'react-router';

import { BrandMark } from '@/components/BrandMark';
import { CookieBanner } from '@/components/legal/CookieBanner';
import { PageSkeleton } from '@/components/PageSkeleton';
import { PublicPageMeta } from '@/components/PublicPageMeta';
import { institution } from '@/content/public-content';
import { useAuth } from '@/hooks/useAuth';
import { useConsent } from '@/hooks/useConsent';
import { paths } from '@/router/paths';
import { touchTarget } from '@/theme/patterns';
import { colors, layout } from '@/theme/tokens';

/** `handle` das rotas públicas: largura do conteúdo (formulários são estreitos). */
export interface PublicPageHandle {
  width?: 'wide' | 'text';
}

const WIDTHS = { form: 560, text: 760, wide: layout.contentMaxWidth } as const;

function usePageWidth(): number {
  const handle = useMatches().at(-1)?.handle as PublicPageHandle | undefined;
  return WIDTHS[handle?.width ?? 'form'];
}

function HeaderAction() {
  const { status } = useAuth();
  const { pathname } = useLocation();
  if (status === 'authenticated') {
    return (
      <Button component={RouterLink} to={paths.home} variant="outlined">
        Ir para o início
      </Button>
    );
  }
  if (status !== 'anonymous' || pathname === paths.login || pathname === paths.signup) {
    return null;
  }
  return (
    <Button component={RouterLink} to={paths.login} variant="outlined">
      Entrar
    </Button>
  );
}

const footerLinks = [
  { label: 'Sobre', to: paths.about },
  { label: 'Ajuda', to: paths.help },
  { label: 'Termos de Uso', to: paths.terms },
  { label: 'Aviso de Privacidade', to: paths.privacy },
] as const;

function Footer() {
  const consent = useConsent();
  return (
    <Box
      component="footer"
      sx={{
        borderTop: `1px solid ${colors.line}`,
        backgroundColor: colors.surface,
        px: 2,
        py: 3,
      }}
    >
      <Stack spacing={1.5} sx={{ maxWidth: layout.contentMaxWidth, mx: 'auto' }}>
        <Stack
          component="nav"
          aria-label="Rodapé"
          direction="row"
          useFlexGap
          sx={{ flexWrap: 'wrap', columnGap: 3, fontSize: '0.875rem' }}
        >
          {footerLinks.map((link) => (
            <Link
              key={link.to}
              component={RouterLink}
              to={link.to}
              color="text.secondary"
              sx={touchTarget}
            >
              {link.label}
            </Link>
          ))}
          {consent.enabled && (
            <Link
              component="button"
              type="button"
              color="text.secondary"
              onClick={consent.openPreferences}
              sx={touchTarget}
            >
              Preferências de cookies
            </Link>
          )}
        </Stack>
        <Typography
          component="address"
          variant="body2"
          color="text.secondary"
          sx={{ fontStyle: 'normal' }}
        >
          {institution.nome} ({institution.sigla}), {institution.cidade}, {institution.estado}.{' '}
          <Link
            href={institution.mapsUrl}
            target="_blank"
            rel="noopener"
            color="text.secondary"
            aria-label="Como chegar (abre o Google Maps em outra aba)"
          >
            Como chegar
          </Link>
        </Typography>
      </Stack>
    </Box>
  );
}

/**
 * Páginas fora do app logado: início público, sobre, ajuda, login, cadastro, comprovante e
 * textos legais. Rodapé institucional em todas (#47).
 */
export default function PublicLayout() {
  const width = usePageWidth();
  const { pathname } = useLocation();
  return (
    <Box sx={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <PublicPageMeta pathname={pathname} />
      <Box
        component="header"
        sx={{
          height: layout.topBarHeight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          px: { xs: 2, md: 4 },
          backgroundColor: colors.surface,
          borderBottom: `1px solid ${colors.line}`,
        }}
      >
        <BrandMark />
        <HeaderAction />
      </Box>
      <Box
        component="main"
        id="conteudo"
        sx={{ flex: 1, width: '100%', maxWidth: width, mx: 'auto', px: 2, py: { xs: 4, md: 8 } }}
      >
        <Suspense fallback={<PageSkeleton />}>
          <Outlet />
        </Suspense>
      </Box>
      <Footer />
      <CookieBanner />
    </Box>
  );
}
