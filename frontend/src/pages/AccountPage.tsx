import Box from '@mui/material/Box';
import Button from '@mui/material/Button';

import { DetailList } from '@/components/DetailList';
import { PageHeader } from '@/components/PageHeader';
import { roleLabels } from '@/domain/roles';
import { useAuth } from '@/hooks/useAuth';

export default function AccountPage() {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <>
      <PageHeader title="Minha conta" description="Seus dados de acesso ao EduSpace." />
      <Box
        sx={{
          border: 1,
          borderColor: 'divider',
          backgroundColor: 'background.paper',
          p: 3,
          maxWidth: 560,
        }}
      >
        <DetailList
          items={[
            { label: 'Nome', value: user.nome },
            { label: 'E-mail', value: user.email },
            { label: 'Perfil', value: roleLabels[user.perfil] },
            { label: 'Matrícula', value: user.matricula ?? 'Não informada' },
          ]}
        />
      </Box>
      <Button variant="outlined" sx={{ mt: 3 }} onClick={logout}>
        Sair da conta
      </Button>
    </>
  );
}
