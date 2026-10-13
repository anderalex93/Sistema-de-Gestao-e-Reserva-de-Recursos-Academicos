import { PageHeader } from '@/components/PageHeader';
import { UpcomingSection } from '@/components/UpcomingSection';

export default function AdminPage() {
  return (
    <>
      <PageHeader
        title="Administração"
        description="Blocos, recursos, usuários e a agenda do campus."
      />
      <UpcomingSection issue={27}>O cadastro de blocos e recursos aparece aqui.</UpcomingSection>
    </>
  );
}
