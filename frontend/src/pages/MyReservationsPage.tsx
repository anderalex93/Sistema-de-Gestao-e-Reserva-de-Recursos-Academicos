import { PageHeader } from '@/components/PageHeader';
import { UpcomingSection } from '@/components/UpcomingSection';

export default function MyReservationsPage() {
  return (
    <>
      <PageHeader title="Minhas reservas" description="Próximas reservas e histórico." />
      <UpcomingSection issue={25}>Suas reservas aparecem aqui.</UpcomingSection>
    </>
  );
}
