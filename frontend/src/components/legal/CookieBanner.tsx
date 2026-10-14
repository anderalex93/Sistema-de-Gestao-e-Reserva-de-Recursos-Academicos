import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Link as RouterLink } from 'react-router';

import { useConsent } from '@/hooks/useConsent';
import { paths } from '@/router/paths';
import { colors, layout, zIndex } from '@/theme/tokens';

interface CookieBannerProps {
  /** No app logado o celular tem a navegação inferior: o aviso fica logo acima dela. */
  aboveBottomNav?: boolean;
}

/**
 * Aviso de cookies (#49). Não bloqueia a tela e não vem com nada pré-escolhido; recusar é tão
 * fácil quanto aceitar (LGPD, Art. 8º). Só aparece se houver medição configurada.
 */
export function CookieBanner({ aboveBottomNav = false }: CookieBannerProps) {
  const { bannerOpen, choose } = useConsent();
  if (!bannerOpen) return null;

  return (
    <Box
      component="section"
      aria-labelledby="aviso-cookies-titulo"
      sx={{
        position: 'fixed',
        zIndex: zIndex.popover,
        left: { xs: 0, md: 24 },
        right: { xs: 0, md: 'auto' },
        bottom: { xs: aboveBottomNav ? layout.bottomNavHeight : 0, md: 24 },
        maxWidth: { md: 480 },
        p: 2.5,
        backgroundColor: colors.surface,
        border: `1px solid ${colors.lineStrong}`,
      }}
    >
      <Typography id="aviso-cookies-titulo" variant="h3" component="h2" sx={{ mb: 1 }}>
        Cookies de medição
      </Typography>
      <Typography variant="body2" sx={{ mb: 2 }}>
        Com a sua permissão, usamos o Google Analytics para saber quais telas são usadas e onde as
        pessoas têm dificuldade. Ele não recebe seu nome, e-mail nem matrícula. Você pode mudar a
        escolha depois em Preferências de cookies.{' '}
        <Link component={RouterLink} to={paths.privacy}>
          Aviso de Privacidade
        </Link>
      </Typography>
      <Stack direction="row" spacing={1}>
        <Button variant="outlined" onClick={() => choose('denied')}>
          Recusar
        </Button>
        <Button variant="outlined" onClick={() => choose('granted')}>
          Aceitar
        </Button>
      </Stack>
    </Box>
  );
}
