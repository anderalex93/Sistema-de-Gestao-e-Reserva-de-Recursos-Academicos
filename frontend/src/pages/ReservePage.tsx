import { PageHeader } from '@/components/PageHeader';
import { UpcomingSection } from '@/components/UpcomingSection';

export default function ReservePage() {
  return (
    <>
      <PageHeader
        title="Reservar espaço"
        description="Filtre por bloco, tipo, recursos e horário para encontrar um espaço livre."
      />
      <UpcomingSection issue={21}>
        A busca com filtros e a lista de salas, laboratórios e equipamentos aparecem aqui.
      </UpcomingSection>
    </>
  );
}
