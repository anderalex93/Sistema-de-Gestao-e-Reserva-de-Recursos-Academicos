import DownloadSharp from '@mui/icons-material/DownloadSharp';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import MenuItem from '@mui/material/MenuItem';
import OutlinedInput from '@mui/material/OutlinedInput';
import Select from '@mui/material/Select';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useId, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router';

import {
  OccupancyHeatmap,
  RankedBars,
  ResourceOccupancyList,
  ResourceOccupancyTable,
  StatTile,
} from '@/components/admin/OccupancyViews';
import { FormError } from '@/components/form/FormError';
import { LoadError } from '@/components/LoadError';
import { PageHeader } from '@/components/PageHeader';
import { hours, percent, PERIOD_PRESETS, presetPeriod } from '@/domain/occupancy';
import { campusToday, dayLabel } from '@/domain/schedule';
import { useAdminOccupancy } from '@/hooks/useAdminOccupancy';
import { useAdminBuildings } from '@/hooks/useAdminCatalog';
import { adminOccupancyApi } from '@/lib/api';
import type { OccupancyParams } from '@/lib/api/admin-occupancy.api';
import { ApiError } from '@/lib/api/api-error';
import { loadFailure } from '@/lib/load-failure';
import { paths } from '@/router/paths';
import { colors } from '@/theme/tokens';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const RANKING_SIZE = 5;
const labelSx = { mb: 0.75, fontWeight: 700, fontSize: '0.875rem', color: 'text.primary' };

function Filter({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <FormControl sx={{ minWidth: 0 }}>
      <FormLabel id={`${id}-rotulo`} htmlFor={id} sx={labelSx}>
        {label}
      </FormLabel>
      {children}
    </FormControl>
  );
}

/** Filtros na URL: o painel pode ser compartilhado e volta igual depois de recarregar. */
function useOccupancyParams(): [
  OccupancyParams,
  (patch: Partial<Record<string, string | null>>) => void,
] {
  const [urlParams, setUrlParams] = useSearchParams();
  const inicio = urlParams.get('inicio');
  const fim = urlParams.get('fim');
  const bloco = Number(urlParams.get('bloco_id'));
  const params: OccupancyParams = {
    ...(inicio && DATE_PATTERN.test(inicio) ? { inicio } : {}),
    ...(fim && DATE_PATTERN.test(fim) ? { fim } : {}),
    ...(Number.isInteger(bloco) && bloco > 0 ? { bloco_id: bloco } : {}),
  };
  const update = (patch: Partial<Record<string, string | null>>) =>
    setUrlParams(
      (current) => {
        const next = new URLSearchParams(current);
        for (const [key, value] of Object.entries(patch)) {
          if (value) next.set(key, value);
          else next.delete(key);
        }
        return next;
      },
      { replace: true },
    );
  return [params, update];
}

function download(csv: string, filename: string) {
  // O navegador decodifica o UTF-8 e descarta o BOM: ele volta para o Excel reconhecer acentos.
  const content = csv.startsWith('﻿') ? csv : `﻿${csv}`;
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/** Painel de ocupação (#44): quanto o campus usa os espaços e quanto o check-in devolve. */
export default function AdminOccupancyPage() {
  const id = useId();
  const [params, update] = useOccupancyParams();
  const query = useAdminOccupancy(params);
  const buildings = useAdminBuildings();
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const data = query.data;
  const failure = loadFailure(query);
  const period = data?.periodo;
  const today = campusToday();
  const activePreset = PERIOD_PRESETS.find((days) => {
    const preset = presetPeriod(days, today);
    return period?.inicio === preset.inicio && period.fim === preset.fim;
  });

  const exportCsv = async () => {
    if (!period) return;
    setExporting(true);
    setExportError(null);
    try {
      const csv = await adminOccupancyApi.csv(params);
      download(csv, `ocupacao-${period.inicio}-a-${period.fim}.csv`);
    } catch (error) {
      setExportError(ApiError.from(error).message);
    } finally {
      setExporting(false);
    }
  };

  const summary = data?.resumo;
  const ranked = data?.recursos ?? [];
  const leastUsed = [...ranked].reverse().slice(0, RANKING_SIZE);

  return (
    <>
      <PageHeader
        title="Ocupação"
        description="Quanto o campus usa cada espaço, quem aparece e quanto tempo o check-in devolve."
        breadcrumbs={[{ label: 'Administração', to: paths.admin }, { label: 'Ocupação' }]}
        actions={
          <Button
            variant="outlined"
            startIcon={<DownloadSharp />}
            onClick={() => void exportCsv()}
            disabled={!period || exporting}
          >
            {exporting ? 'Gerando…' : 'Baixar CSV'}
          </Button>
        }
      />
      <FormError message={exportError} />

      <Box
        component="section"
        aria-label="Filtros"
        sx={{
          border: 1,
          borderColor: 'divider',
          backgroundColor: 'background.paper',
          p: 2.5,
          mb: 3,
          display: 'grid',
          gap: 2,
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 170px), 1fr))',
          alignItems: 'end',
        }}
      >
        <Box component="fieldset" sx={{ gridColumn: '1 / -1', border: 0, m: 0, p: 0, minWidth: 0 }}>
          <Typography component="legend" sx={labelSx}>
            Período
          </Typography>
          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
            {PERIOD_PRESETS.map((days) => (
              <Button
                key={days}
                variant={activePreset === days ? 'contained' : 'outlined'}
                aria-pressed={activePreset === days}
                onClick={() => update(presetPeriod(days, today))}
              >
                Últimos {days} dias
              </Button>
            ))}
          </Stack>
        </Box>
        <Filter id={`${id}-inicio`} label="De">
          <OutlinedInput
            id={`${id}-inicio`}
            type="date"
            value={period?.inicio ?? ''}
            onChange={(event) => update({ inicio: event.target.value || null })}
            slotProps={{ input: { max: today } }}
          />
        </Filter>
        <Filter id={`${id}-fim`} label="Até">
          <OutlinedInput
            id={`${id}-fim`}
            type="date"
            value={period?.fim ?? ''}
            onChange={(event) => update({ fim: event.target.value || null })}
          />
        </Filter>
        <Filter id={`${id}-bloco`} label="Bloco">
          <Select
            id={`${id}-bloco`}
            labelId={`${id}-bloco-rotulo`}
            value={params.bloco_id ? String(params.bloco_id) : ''}
            onChange={(event) => update({ bloco_id: event.target.value || null })}
            displayEmpty
          >
            <MenuItem value="">Todos os blocos</MenuItem>
            {(buildings.data ?? []).map((building) => (
              <MenuItem key={building.id} value={String(building.id)}>
                {building.nome}
              </MenuItem>
            ))}
          </Select>
        </Filter>
      </Box>

      {failure ? (
        <LoadError error={failure} onRetry={() => void query.refetch()} />
      ) : !data || !summary || !period ? (
        <Stack spacing={2} aria-busy="true" aria-label="Carregando ocupação">
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            }}
          >
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={`esqueleto-${index}`} variant="rectangular" height={128} />
            ))}
          </Box>
          <Skeleton variant="rectangular" height={420} />
        </Stack>
      ) : (
        <Stack spacing={4} aria-busy={query.isPlaceholderData}>
          <Typography color="text.secondary" aria-live="polite">
            De {dayLabel(period.inicio)} a {dayLabel(period.fim)}.
          </Typography>
          <Box
            component="section"
            aria-label="Resumo"
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 220px), 1fr))',
            }}
          >
            <StatTile
              label="Ocupação"
              value={percent(summary.taxa_ocupacao)}
              detail={`${hours(summary.horas_reservadas)} reservadas de ${hours(summary.horas_disponiveis)} disponíveis`}
            />
            <StatTile
              label="Comparecimento"
              value={
                summary.taxa_comparecimento === null
                  ? 'Sem dados'
                  : percent(summary.taxa_comparecimento)
              }
              detail={`${summary.checkins} check-ins e ${summary.nao_comparecimentos} reservas sem ninguém`}
            />
            <StatTile
              label="Horas devolvidas"
              value={hours(summary.horas_devolvidas)}
              detail="Liberadas por falta de check-in e abertas de novo para o campus"
            />
            <StatTile
              label="Cancelamentos"
              value={percent(summary.taxa_cancelamento)}
              detail={`${summary.cancelamentos} de ${summary.reservas + summary.cancelamentos} reservas`}
            />
          </Box>

          <Box component="section" aria-labelledby={`${id}-mapa`}>
            <Typography id={`${id}-mapa`} variant="h2" sx={{ mb: 1 }}>
              Quando o campus mais reserva
            </Typography>
            <OccupancyHeatmap cells={data.mapa_calor} />
          </Box>

          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
            }}
          >
            <RankedBars
              title="Mais usados"
              items={ranked.slice(0, RANKING_SIZE)}
              empty="Nenhum espaço neste filtro."
            />
            <RankedBars
              title="Menos usados"
              items={leastUsed}
              empty="Nenhum espaço neste filtro."
            />
          </Box>

          <Box component="section" aria-labelledby={`${id}-todos`}>
            <Typography id={`${id}-todos`} variant="h2" sx={{ mb: 1.5 }}>
              Todos os espaços
            </Typography>
            {ranked.length === 0 ? (
              <Typography color="text.secondary">Nenhum espaço neste filtro.</Typography>
            ) : (
              <>
                <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                  <ResourceOccupancyTable items={ranked} />
                </Box>
                <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                  <ResourceOccupancyList items={ranked} />
                </Box>
              </>
            )}
            <Typography variant="body2" sx={{ mt: 1, color: colors.inkMuted }}>
              Só espaços ativos. O CSV traz estes mesmos números.
            </Typography>
          </Box>
        </Stack>
      )}
    </>
  );
}
