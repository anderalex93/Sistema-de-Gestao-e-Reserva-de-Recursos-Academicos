import { useParams } from 'react-router';

import { PageHeader } from '@/components/PageHeader';
import { UpcomingSection } from '@/components/UpcomingSection';
import { paths } from '@/router/paths';

export default function ResourcePage() {
  const { id = '' } = useParams();
  const title = `Recurso ${id}`;

  return (
    <>
      <PageHeader
        title={title}
        breadcrumbs={[{ label: 'Reservar', to: paths.reserve }, { label: title }]}
      />
      <UpcomingSection issue={22}>A grade de horários do dia aparece aqui.</UpcomingSection>
    </>
  );
}
