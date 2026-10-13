import { PageHeader } from '@/components/PageHeader';
import { UpcomingSection } from '@/components/UpcomingSection';

export default function AccountPage() {
  return (
    <>
      <PageHeader title="Minha conta" description="Seus dados e a saída da sessão." />
      <UpcomingSection issue={16}>Os dados da sua conta aparecem aqui.</UpcomingSection>
    </>
  );
}
