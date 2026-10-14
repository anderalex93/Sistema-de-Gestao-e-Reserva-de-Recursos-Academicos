import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import { Navigate, Outlet, Link as RouterLink, useLocation } from 'react-router';

import { AcceptTermsGate } from '@/components/legal/AcceptTermsGate';
import { PageHeader } from '@/components/PageHeader';
import { PageSkeleton } from '@/components/PageSkeleton';
import { AuthProvider } from '@/contexts/AuthProvider';
import { useAuth } from '@/hooks/useAuth';
import { usePageViews } from '@/hooks/usePageViews';
import type { UserRole } from '@/lib/api/types';
import { paths } from '@/router/paths';

export interface RedirectState {
  from?: { pathname: string; search?: string };
}

/**
 * Raiz das rotas: a sessão precisa do roteador (navegação no logout e na expiração), e a
 * medição de páginas precisa da rota atual.
 */
export function AuthRoot() {
  usePageViews();
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}

/** Rotas que exigem login. Sem sessão, vai para o login e volta para onde estava. */
export function RequireAuth() {
  const { status, user, retry } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return (
      <Box sx={{ maxWidth: 560, mx: 'auto', px: 2, py: 8 }}>
        <PageSkeleton />
      </Box>
    );
  }
  if (status === 'error') {
    return (
      <Box component="main" sx={{ maxWidth: 560, mx: 'auto', px: 2, py: 8 }}>
        <PageHeader
          title="Não foi possível carregar sua sessão"
          description="O servidor não respondeu. Verifique sua conexão e tente de novo."
        />
        <Button variant="contained" onClick={retry}>
          Tentar de novo
        </Button>
      </Box>
    );
  }
  if (status === 'anonymous') {
    const state: RedirectState = {
      from: { pathname: location.pathname, search: location.search },
    };
    return <Navigate to={paths.login} replace state={state} />;
  }
  if (user?.aceite_termos_em === null) {
    return <AcceptTermsGate />;
  }
  return <Outlet />;
}

/** Rotas restritas a perfis. Quem não tem o perfil vê uma explicação, sem tela em branco. */
export function RequireRole({ roles }: { roles: readonly UserRole[] }) {
  const { user } = useAuth();

  if (!user || !roles.includes(user.perfil)) {
    return (
      <>
        <PageHeader
          title="Acesso restrito"
          overline="Erro 403"
          description="Esta área é exclusiva da administração do campus."
        />
        <Stack direction="row">
          <Button component={RouterLink} to={paths.home} variant="outlined">
            Ir para o início
          </Button>
        </Stack>
      </>
    );
  }
  return <Outlet />;
}

/**
 * Login e cadastro: quem está logado sai daqui. Ao entrar, volta para a página que tentou abrir
 * (é o único ponto que navega após o login, para não haver dois redirecionamentos concorrendo).
 */
export function PublicOnly() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'authenticated') {
    const from = (location.state as RedirectState | null)?.from;
    return <Navigate to={from ? `${from.pathname}${from.search ?? ''}` : paths.home} replace />;
  }
  return <Outlet />;
}
