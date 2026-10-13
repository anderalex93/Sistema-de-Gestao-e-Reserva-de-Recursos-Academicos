import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';
import { Link as RouterLink } from 'react-router';

import { config } from '@/config';

export interface Crumb {
  label: string;
  to?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  overline?: string;
  breadcrumbs?: readonly Crumb[];
  actions?: ReactNode;
}

/** Cabeçalho padrão: título único da aba, breadcrumbs, título em Literata e ação principal. */
export function PageHeader({
  title,
  description,
  overline,
  breadcrumbs,
  actions,
}: PageHeaderProps) {
  return (
    <Stack component="header" spacing={1.5} sx={{ mb: 3 }}>
      <title>{`${title} · ${config.appName}`}</title>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs aria-label="Você está em" sx={{ fontSize: '0.875rem' }}>
          {breadcrumbs.map((crumb) =>
            crumb.to ? (
              <Link key={crumb.label} component={RouterLink} to={crumb.to} color="text.secondary">
                {crumb.label}
              </Link>
            ) : (
              <Typography
                key={crumb.label}
                aria-current="page"
                sx={{ fontSize: 'inherit', fontWeight: 700 }}
              >
                {crumb.label}
              </Typography>
            ),
          )}
        </Breadcrumbs>
      )}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'flex-end' } }}
      >
        <Stack spacing={0.75} sx={{ minWidth: 0 }}>
          {overline && <Typography variant="overline">{overline}</Typography>}
          <Typography variant="h1">{title}</Typography>
          {description && (
            <Typography color="text.secondary" sx={{ maxWidth: '65ch' }}>
              {description}
            </Typography>
          )}
        </Stack>
        {actions}
      </Stack>
    </Stack>
  );
}
