import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { Link as RouterLink } from 'react-router';

import { DeleteAccountDialog } from '@/components/account/DeleteAccountDialog';
import { DetailList } from '@/components/DetailList';
import { PageHeader } from '@/components/PageHeader';
import { roleLabels } from '@/domain/roles';
import { useExportData } from '@/hooks/useAccount';
import { useAuth } from '@/hooks/useAuth';
import { useConsent } from '@/hooks/useConsent';
import { useFeedback } from '@/hooks/useFeedback';
import { ApiError } from '@/lib/api/api-error';
import type { MyDataExport } from '@/lib/api/types';
import { paths } from '@/router/paths';

const CONSENT_LABELS = { granted: 'aceitos', denied: 'recusados', pending: 'sem escolha' } as const;

const panelSx = {
  border: 1,
  borderColor: 'divider',
  backgroundColor: 'background.paper',
  p: 3,
  maxWidth: 560,
} as const;

/** Entrega o JSON como arquivo, sem guardar nada no navegador. */
function download(data: MyDataExport) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `eduspace-meus-dados-${data.gerado_em.slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function AccountPage() {
  const { user, logout } = useAuth();
  const { notify } = useFeedback();
  const consent = useConsent();
  const exportData = useExportData();
  const [deleting, setDeleting] = useState(false);
  if (!user) return null;

  return (
    <>
      <PageHeader title="Minha conta" description="Seus dados de acesso ao EduSpace." />
      <Stack spacing={3}>
        <Box sx={panelSx}>
          <DetailList
            items={[
              { label: 'Nome', value: user.nome },
              { label: 'E-mail', value: user.email },
              { label: 'Perfil', value: roleLabels[user.perfil] },
              { label: 'Matrícula', value: user.matricula ?? 'Não informada' },
            ]}
          />
        </Box>

        <Box component="section" aria-labelledby="seus-dados" sx={panelSx}>
          <Typography id="seus-dados" variant="h2" sx={{ fontSize: '1.25rem', mb: 1 }}>
            Seus dados
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Baixe tudo o que o EduSpace guarda sobre você ou exclua a sua conta. Saiba mais no{' '}
            <Link component={RouterLink} to={paths.privacy}>
              Aviso de Privacidade
            </Link>
            .
          </Typography>
          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              disabled={exportData.isPending}
              onClick={() =>
                exportData.mutate(undefined, {
                  onSuccess: (data) => {
                    download(data);
                    notify({ message: 'Arquivo com os seus dados baixado.', severity: 'success' });
                  },
                  onError: (error) =>
                    notify({ message: ApiError.from(error).message, severity: 'error' }),
                })
              }
            >
              {exportData.isPending ? 'Preparando…' : 'Baixar meus dados'}
            </Button>
            {user.perfil !== 'ADMIN' && (
              <Button variant="outlined" color="error" onClick={() => setDeleting(true)}>
                Excluir conta
              </Button>
            )}
          </Stack>
          {consent.enabled && (
            <Typography variant="body2" sx={{ mt: 2 }}>
              Cookies de medição: {CONSENT_LABELS[consent.choice ?? 'pending']}.{' '}
              <Link component="button" type="button" onClick={consent.openPreferences}>
                Preferências de cookies
              </Link>
            </Typography>
          )}
          {user.perfil === 'ADMIN' && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
              Contas de administrador não podem ser excluídas por aqui. Peça a outro administrador
              para mudar o seu perfil antes.
            </Typography>
          )}
        </Box>

        <Box>
          <Button variant="outlined" onClick={logout}>
            Sair da conta
          </Button>
        </Box>
      </Stack>

      {deleting && <DeleteAccountDialog onClose={() => setDeleting(false)} />}
    </>
  );
}
