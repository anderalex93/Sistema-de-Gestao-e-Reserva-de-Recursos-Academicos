import ContentCopySharp from '@mui/icons-material/ContentCopySharp';
import PrintSharp from '@mui/icons-material/PrintSharp';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import GlobalStyles from '@mui/material/GlobalStyles';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { QRCodeSVG } from 'qrcode.react';
import { useEffect } from 'react';
import { useParams } from 'react-router';

import { DetailList } from '@/components/DetailList';
import { LoadError } from '@/components/LoadError';
import { PageHeader } from '@/components/PageHeader';
import { StatusLabel } from '@/components/reservation/StatusLabel';
import { displayStatus } from '@/domain/reservation-status';
import { resourceTypeLabels } from '@/domain/resource-types';
import { campusTime, campusToday, dayLabel } from '@/domain/schedule';
import { useFeedback } from '@/hooks/useFeedback';
import { useReceipt } from '@/hooks/useReservations';
import { analytics } from '@/lib/analytics';
import { ApiError } from '@/lib/api/api-error';
import { loadFailure } from '@/lib/load-failure';
import { colors, fonts } from '@/theme/tokens';

/** Na impressão sai só o comprovante: sem cabeçalho do site e sem os botões. */
const printStyles = (
  <GlobalStyles
    styles={{
      '@media print': {
        'body > div header, [data-print="hide"]': { display: 'none !important' },
        body: { backgroundColor: '#fff' },
      },
    }}
  />
);

function campusDate(iso: string): string {
  return campusToday(new Date(iso));
}

export default function ReceiptPage() {
  const { codigo = '' } = useParams();
  const query = useReceipt(codigo);
  const viewedStatus = query.data ? displayStatus(query.data.status, query.data.fim) : null;
  useEffect(() => {
    if (viewedStatus)
      analytics.track({ name: 'receipt_viewed', params: { situacao: viewedStatus } });
  }, [viewedStatus]);
  const { notify } = useFeedback();
  const url = `${window.location.origin}/comprovantes/${codigo}`;

  const failure = loadFailure(query);
  if (failure) {
    const notFound = ApiError.from(failure).status === 404;
    return (
      <>
        <PageHeader
          title={notFound ? 'Comprovante não encontrado' : 'Comprovante'}
          overline="Verificação de reserva"
          description={
            notFound
              ? `Não existe reserva com o código ${codigo.toUpperCase()}. Confira as letras e números.`
              : undefined
          }
        />
        {!notFound && <LoadError error={query.error} onRetry={() => void query.refetch()} />}
      </>
    );
  }

  const receipt = query.data;
  if (!receipt) {
    return (
      <Stack spacing={1.5} aria-busy="true" aria-label="Carregando comprovante">
        <Skeleton variant="rectangular" width={240} height={40} />
        <Skeleton variant="rectangular" height={420} />
      </Stack>
    );
  }

  const status = displayStatus(receipt.status, receipt.fim);
  const { recurso } = receipt;
  const place = recurso.andar ? `${recurso.bloco.nome} · ${recurso.andar}` : recurso.bloco.nome;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      notify({ message: 'Link do comprovante copiado.' });
    } catch {
      notify({
        message: 'Não foi possível copiar. Copie o endereço na barra do navegador.',
        severity: 'error',
      });
    }
  };

  return (
    <>
      {printStyles}
      <PageHeader title={`Comprovante ${receipt.codigo}`} overline="Verificação de reserva" />
      <Box
        component="article"
        aria-label={`Comprovante ${receipt.codigo}`}
        sx={{ border: 1, borderColor: colors.lineStrong, backgroundColor: 'background.paper' }}
      >
        <Stack spacing={2} sx={{ p: 3 }}>
          <StatusLabel status={status} size="large" />
          <Box>
            <Typography variant="overline" component="p">
              Código
            </Typography>
            <Typography
              sx={{
                fontFamily: fonts.data,
                fontSize: '2rem',
                fontWeight: 500,
                letterSpacing: '0.04em',
              }}
            >
              {receipt.codigo}
            </Typography>
          </Box>
          <DetailList
            items={[
              { label: 'Recurso', value: `${recurso.nome} (${resourceTypeLabels[recurso.tipo]})` },
              { label: 'Local', value: place },
              { label: 'Data', value: dayLabel(campusDate(receipt.inicio)) },
              {
                label: 'Horário',
                value: `${campusTime(receipt.inicio)} às ${campusTime(receipt.fim)}`,
              },
              { label: 'Responsável', value: receipt.responsavel },
            ]}
          />
          {status === 'CANCELADA' && (
            <Typography sx={{ color: colors.error, fontWeight: 500 }}>
              Esta reserva foi cancelada e não dá mais direito ao uso do espaço.
            </Typography>
          )}
        </Stack>
        {/* Canhoto: fio tracejado separando o QR code (design system, comprovante). */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2.5}
          sx={{ p: 3, borderTop: `1px dashed ${colors.lineStrong}`, alignItems: { sm: 'center' } }}
        >
          <Box sx={{ backgroundColor: colors.surface, lineHeight: 0, alignSelf: 'flex-start' }}>
            <QRCodeSVG
              value={url}
              size={160}
              fgColor={colors.ink}
              bgColor={colors.surface}
              level="M"
              title={`QR code do comprovante ${receipt.codigo}`}
            />
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: '32ch' }}>
            Apresente na entrada. Quem ler o QR code vê a situação atual da reserva.
          </Typography>
        </Stack>
      </Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 3 }} data-print="hide">
        <Button variant="contained" startIcon={<PrintSharp />} onClick={() => window.print()}>
          Imprimir ou salvar PDF
        </Button>
        <Button variant="outlined" startIcon={<ContentCopySharp />} onClick={() => void copyLink()}>
          Copiar link
        </Button>
      </Stack>
    </>
  );
}
