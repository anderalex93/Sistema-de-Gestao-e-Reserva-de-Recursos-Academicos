import { useParams } from 'react-router';

import { PageHeader } from '@/components/PageHeader';
import { UpcomingSection } from '@/components/UpcomingSection';

export default function ReceiptPage() {
  const { codigo = '' } = useParams();

  return (
    <>
      <PageHeader title={`Comprovante ${codigo}`} overline="Verificação de reserva" />
      <UpcomingSection issue={24}>
        Os dados da reserva e o QR code de verificação aparecem aqui.
      </UpcomingSection>
    </>
  );
}
