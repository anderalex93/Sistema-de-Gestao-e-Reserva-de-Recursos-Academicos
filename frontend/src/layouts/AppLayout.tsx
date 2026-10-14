import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import { Suspense } from 'react';
import { NavLink, Link as RouterLink, Outlet } from 'react-router';

import { BrandMark } from '@/components/BrandMark';
import { CookieBanner } from '@/components/legal/CookieBanner';
import { PageSkeleton } from '@/components/PageSkeleton';
import { useAuth } from '@/hooks/useAuth';
import { accountNav, adminNav, boardNav, primaryNav, type NavItem } from '@/layouts/navigation';
import { paths } from '@/router/paths';
import { touchTarget } from '@/theme/patterns';
import { colors, layout, zIndex } from '@/theme/tokens';

const MAIN_ID = 'conteudo';

const sideLinkSx = {
  display: 'flex',
  alignItems: 'center',
  gap: 1.25,
  px: 1.5,
  minHeight: 44,
  borderRadius: '2px',
  color: colors.ink,
  textDecoration: 'none',
  fontSize: '0.9375rem',
  '&:hover': { backgroundColor: colors.sunken },
  '&.active': { backgroundColor: colors.primaryTint, color: colors.primary, fontWeight: 700 },
} as const;

function SideNavLink({ item }: { item: NavItem }) {
  const Icon = item.icon;
  return (
    <Box component={NavLink} to={item.to} end={item.end} sx={sideLinkSx}>
      <Icon fontSize="small" aria-hidden />
      {item.label}
    </Box>
  );
}

function SideNav() {
  const { user } = useAuth();
  const main = [...primaryNav.slice(0, 2), boardNav, ...primaryNav.slice(2)];
  const items = user?.perfil === 'ADMIN' ? [...main, adminNav] : main;
  return (
    <Box
      component="aside"
      sx={{
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        gap: 0.5,
        width: layout.sideNavWidth,
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        height: '100dvh',
        px: 1.5,
        py: 2,
        backgroundColor: colors.surface,
        borderRight: `1px solid ${colors.line}`,
      }}
    >
      <Box sx={{ px: 1, pb: 2 }}>
        <BrandMark />
      </Box>
      <Box component="nav" aria-label="Navegação principal" sx={{ display: 'grid', gap: 0.5 }}>
        {items.map((item) => (
          <SideNavLink key={item.to} item={item} />
        ))}
      </Box>
    </Box>
  );
}

function TopBar() {
  const { user, logout } = useAuth();
  return (
    <Box
      component="header"
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: zIndex.stickyBar,
        height: layout.topBarHeight,
        display: 'flex',
        alignItems: 'center',
        justifyContent: { xs: 'space-between', md: 'flex-end' },
        gap: 2,
        px: { xs: 2, md: 4 },
        backgroundColor: colors.surface,
        borderBottom: `1px solid ${colors.line}`,
      }}
    >
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        <BrandMark />
      </Box>
      {user && (
        <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 2 }}>
          <Box
            component={RouterLink}
            to={paths.account}
            sx={{ color: 'text.secondary', fontSize: '0.875rem', textDecoration: 'none' }}
          >
            {user.nome}
          </Box>
          <Button variant="outlined" size="small" onClick={logout}>
            Sair
          </Button>
        </Box>
      )}
    </Box>
  );
}

const bottomLinkSx = {
  display: 'grid',
  justifyItems: 'center',
  alignContent: 'center',
  gap: 0.25,
  minHeight: layout.bottomNavHeight,
  color: colors.inkMuted,
  textDecoration: 'none',
  fontSize: '0.75rem',
  borderTop: '2px solid transparent',
  '&.active': { color: colors.primary, fontWeight: 700, borderTopColor: colors.primary },
} as const;

function BottomNav() {
  return (
    <Box
      component="nav"
      aria-label="Navegação inferior"
      sx={{
        display: { xs: 'grid', md: 'none' },
        gridTemplateColumns: 'repeat(4, 1fr)',
        position: 'fixed',
        insetInline: 0,
        bottom: 0,
        zIndex: zIndex.navigation,
        pb: 'env(safe-area-inset-bottom, 0px)',
        backgroundColor: colors.surface,
        borderTop: `1px solid ${colors.line}`,
      }}
    >
      {[...primaryNav, accountNav].map((item) => {
        const Icon = item.icon;
        return (
          <Box key={item.to} component={NavLink} to={item.to} end={item.end} sx={bottomLinkSx}>
            <Icon aria-hidden />
            {item.shortLabel}
          </Box>
        );
      })}
    </Box>
  );
}

/** Shell da aplicação: navegação lateral no desktop e inferior no celular. */
export default function AppLayout() {
  return (
    <Box sx={{ display: 'flex', minHeight: '100dvh' }}>
      {/* Telas de quem está logado não têm o que indexar (#48). */}
      <meta name="robots" content="noindex" />
      <Link
        href={`#${MAIN_ID}`}
        sx={{
          position: 'absolute',
          left: 8,
          top: -64,
          zIndex: zIndex.snackbar,
          ...touchTarget,
          px: 1.5,
          backgroundColor: colors.surface,
          '&:focus': { top: 8 },
        }}
      >
        Pular para o conteúdo
      </Link>
      <SideNav />
      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <TopBar />
        <Box
          component="main"
          id={MAIN_ID}
          tabIndex={-1}
          sx={{
            flex: 1,
            width: '100%',
            maxWidth: layout.contentMaxWidth,
            px: { xs: 2, md: 4 },
            pt: 3,
            pb: { xs: `${layout.bottomNavHeight + 24}px`, md: 4 },
            outline: 'none',
          }}
        >
          <Suspense fallback={<PageSkeleton />}>
            <Outlet />
          </Suspense>
        </Box>
      </Box>
      <BottomNav />
      <CookieBanner aboveBottomNav />
    </Box>
  );
}
