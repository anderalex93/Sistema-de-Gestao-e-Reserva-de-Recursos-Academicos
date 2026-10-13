import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import { Link as RouterLink } from 'react-router';

import { PageHeader } from '@/components/PageHeader';
import { UpcomingSection } from '@/components/UpcomingSection';
import { paths } from '@/router/paths';

export default function LoginPage() {
  return (
    <>
      <PageHeader title="Entrar" description="Use o seu e-mail institucional da UMJ." />
      <UpcomingSection issue={16}>O formulário de login aparece aqui.</UpcomingSection>
      <Typography sx={{ mt: 3 }}>
        Ainda não tem conta?{' '}
        <Link component={RouterLink} to={paths.signup}>
          Criar conta
        </Link>
      </Typography>
    </>
  );
}
