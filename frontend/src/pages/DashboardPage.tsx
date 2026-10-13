import Button from '@mui/material/Button';
import { Link as RouterLink } from 'react-router';

import { PageHeader } from '@/components/PageHeader';
import { UpcomingSection } from '@/components/UpcomingSection';
import { paths } from '@/router/paths';

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Início"
        description="Suas próximas reservas e o atalho para reservar um espaço."
        actions={
          <Button component={RouterLink} to={paths.reserve} variant="contained">
            Reservar espaço
          </Button>
        }
      />
      <UpcomingSection issue={25}>Sua próxima reserva aparece aqui.</UpcomingSection>
    </>
  );
}
