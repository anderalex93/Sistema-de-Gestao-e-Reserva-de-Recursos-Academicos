import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import { Link as RouterLink } from 'react-router';

import { PageHeader } from '@/components/PageHeader';
import { UpcomingSection } from '@/components/UpcomingSection';
import { paths } from '@/router/paths';

export default function SignupPage() {
  return (
    <>
      <PageHeader
        title="Criar conta"
        description="O cadastro aceita apenas e-mails institucionais da UMJ."
      />
      <UpcomingSection issue={15}>O formulário de cadastro aparece aqui.</UpcomingSection>
      <Typography sx={{ mt: 3 }}>
        Já tem conta?{' '}
        <Link component={RouterLink} to={paths.login}>
          Entrar
        </Link>
      </Typography>
    </>
  );
}
