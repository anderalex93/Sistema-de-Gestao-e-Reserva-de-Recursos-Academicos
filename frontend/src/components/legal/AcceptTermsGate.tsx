import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { Link as RouterLink } from 'react-router';

import { FormError } from '@/components/form/FormError';
import { PageHeader } from '@/components/PageHeader';
import { useAcceptTerms } from '@/hooks/useAccount';
import { useAuth } from '@/hooks/useAuth';
import { ApiError } from '@/lib/api/api-error';
import { paths } from '@/router/paths';

/**
 * Conta criada pela administração ainda não aceitou os termos: o admin não pode consentir pela
 * pessoa, então o aceite acontece aqui, antes de qualquer tela do app (LGPD, Art. 8º e 9º).
 */
export function AcceptTermsGate() {
  const { user, logout } = useAuth();
  const accept = useAcceptTerms();
  const [error, setError] = useState<string | null>(null);

  return (
    <Box component="main" sx={{ maxWidth: 560, mx: 'auto', px: 2, py: { xs: 4, md: 8 } }}>
      <PageHeader
        title="Antes de continuar"
        description={`${user?.nome ?? 'Olá'}, a sua conta foi criada pela administração do campus.`}
      />
      <Stack spacing={2.5}>
        <FormError message={error} />
        <Typography>
          Para usar o EduSpace, leia como guardamos e usamos os seus dados e as regras de uso dos
          espaços.
        </Typography>
        <Stack component="ul" spacing={1} sx={{ m: 0, pl: 3 }}>
          <li>
            <Link component={RouterLink} to={paths.privacy} target="_blank" rel="noopener">
              Aviso de Privacidade
            </Link>
          </li>
          <li>
            <Link component={RouterLink} to={paths.terms} target="_blank" rel="noopener">
              Termos de Uso
            </Link>
          </li>
        </Stack>
        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            disabled={accept.isPending}
            onClick={() => {
              setError(null);
              accept.mutate(undefined, {
                onError: (failure) => setError(ApiError.from(failure).message),
              });
            }}
          >
            {accept.isPending ? 'Registrando…' : 'Li e concordo, continuar'}
          </Button>
          <Button variant="outlined" onClick={logout} disabled={accept.isPending}>
            Sair
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
