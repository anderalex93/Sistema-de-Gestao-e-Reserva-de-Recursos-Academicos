import AutorenewSharp from '@mui/icons-material/AutorenewSharp';
import PrintSharp from '@mui/icons-material/PrintSharp';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import GlobalStyles from '@mui/material/GlobalStyles';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { QRCodeSVG } from 'qrcode.react';
import { useRef, useState } from 'react';
import { useParams } from 'react-router';

import { BrandMark } from '@/components/BrandMark';
import { FormError } from '@/components/form/FormError';
import { LoadError } from '@/components/LoadError';
import { PageHeader } from '@/components/PageHeader';
import { locationLabel, resourceTypeLabels } from '@/domain/resource-types';
import { useAdminResource, useCatalogMutation } from '@/hooks/useAdminCatalog';
import { useFeedback } from '@/hooks/useFeedback';
import { useRules } from '@/hooks/useRules';
import { adminCatalogApi } from '@/lib/api';
import { ApiError } from '@/lib/api/api-error';
import { focusIfIdle } from '@/lib/focus';
import { loadFailure } from '@/lib/load-failure';
import { paths } from '@/router/paths';
import { colors, fonts } from '@/theme/tokens';

// Na impressão sai só o cartaz, em página inteira.
const printStyles = (
  <GlobalStyles
    styles={{
      '@media print': {
        'body *': { visibility: 'hidden' },
        '[data-print="poster"], [data-print="poster"] *': { visibility: 'visible' },
        '[data-print="poster"]': { position: 'absolute', inset: 0, border: '0 !important' },
        body: { backgroundColor: '#fff' },
      },
    }}
  />
);

function RenewDialog({
  resourceName,
  onConfirm,
  onClose,
  pending,
  error,
}: {
  resourceName: string;
  onConfirm: () => void;
  onClose: () => void;
  pending: boolean;
  error: string | null;
}) {
  const keepButton = useRef<HTMLButtonElement>(null);
  return (
    <Dialog
      open
      onClose={pending ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      aria-labelledby="renovar-qr-titulo"
      slotProps={{ transition: { onEntered: () => focusIfIdle(keepButton) } }}
    >
      <DialogTitle id="renovar-qr-titulo" sx={{ fontFamily: 'h2.fontFamily', fontWeight: 500 }}>
        Gerar um novo QR para {resourceName}?
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <FormError message={error} />
          <Typography>
            O QR impresso hoje deixa de funcionar na hora. Use quando o cartaz da porta for
            fotografado e compartilhado, ou para trocar um cartaz danificado.
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1, flexWrap: 'wrap' }}>
        <Button variant="outlined" onClick={onClose} disabled={pending} ref={keepButton}>
          Manter o atual
        </Button>
        <Button variant="contained" onClick={onConfirm} disabled={pending}>
          {pending ? 'Gerando…' : 'Gerar novo QR'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/** Cartaz para a porta do espaço (#43): quem reservou lê o QR ao chegar e confirma presença. */
export default function AdminResourceQrPage() {
  const { id = '' } = useParams();
  const resourceId = Number(id);
  const query = useAdminResource(resourceId);
  const rules = useRules();
  const { notify } = useFeedback();
  const renew = useCatalogMutation((target: number) => adminCatalogApi.renewCheckinToken(target));
  const [confirming, setConfirming] = useState(false);
  const failure = loadFailure(query);
  const resource = query.data;
  const breadcrumbs = [
    { label: 'Administração', to: paths.admin },
    { label: 'Recursos', to: paths.adminResources },
    { label: resource?.nome ?? 'QR da porta' },
  ];

  if (failure) {
    return (
      <>
        <PageHeader title="QR da porta" breadcrumbs={breadcrumbs} />
        <LoadError error={failure} onRetry={() => void query.refetch()} />
      </>
    );
  }

  if (!resource) {
    return (
      <Stack spacing={1.5} aria-busy="true" aria-label="Carregando QR da porta">
        <Skeleton variant="rectangular" width={240} height={40} />
        <Skeleton variant="rectangular" height={520} sx={{ maxWidth: 560 }} />
      </Stack>
    );
  }

  const url = `${window.location.origin}${paths.checkin(resource.checkin_token)}`;

  return (
    <>
      {printStyles}
      <PageHeader
        title={`QR da porta · ${resource.nome}`}
        description="Imprima e fixe na entrada do espaço. Quem reservou lê o código ao chegar para confirmar a presença."
        breadcrumbs={breadcrumbs}
        actions={
          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
            <Button variant="contained" startIcon={<PrintSharp />} onClick={() => window.print()}>
              Imprimir
            </Button>
            <Button
              variant="outlined"
              startIcon={<AutorenewSharp />}
              onClick={() => setConfirming(true)}
            >
              Gerar novo QR
            </Button>
          </Stack>
        }
      />

      <Box
        component="section"
        data-print="poster"
        aria-label={`Cartaz de check-in de ${resource.nome}`}
        sx={{
          maxWidth: 560,
          p: { xs: 3, sm: 5 },
          border: `1px solid ${colors.lineStrong}`,
          backgroundColor: colors.surface,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: 2.5,
        }}
      >
        <BrandMark />
        <Box>
          <Typography variant="overline" component="p">
            {resourceTypeLabels[resource.tipo]} · {locationLabel(resource)}
          </Typography>
          <Typography variant="h1" component="p" sx={{ fontSize: { xs: '2rem', sm: '2.5rem' } }}>
            {resource.nome}
          </Typography>
        </Box>
        <Box sx={{ p: 2, backgroundColor: colors.surface, lineHeight: 0 }}>
          <QRCodeSVG
            value={url}
            size={260}
            level="M"
            fgColor={colors.ink}
            title={`QR de check-in de ${resource.nome}`}
          />
        </Box>
        <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, maxWidth: '28ch' }}>
          Chegou para a sua reserva? Leia este código com a câmera do celular.
        </Typography>
        {rules.checkinToleranceMin > 0 && (
          <Typography color="text.secondary" sx={{ maxWidth: '40ch' }}>
            Sem check-in até {rules.checkinToleranceMin} minutos depois do início, a reserva é
            liberada e o espaço volta a ficar livre para outras pessoas.
          </Typography>
        )}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontFamily: fonts.data, overflowWrap: 'anywhere' }}
        >
          {url}
        </Typography>
      </Box>

      {confirming && (
        <RenewDialog
          resourceName={resource.nome}
          pending={renew.isPending}
          error={renew.error ? ApiError.from(renew.error).message : null}
          onClose={() => {
            renew.reset();
            setConfirming(false);
          }}
          onConfirm={() =>
            renew.mutate(resource.id, {
              onSuccess: () => {
                setConfirming(false);
                notify({
                  message: 'Novo QR gerado. Imprima e troque o cartaz da porta.',
                  severity: 'success',
                });
              },
            })
          }
        />
      )}
    </>
  );
}
