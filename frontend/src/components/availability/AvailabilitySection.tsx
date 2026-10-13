import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router';

import { DayPicker } from '@/components/availability/DayPicker';
import { SlotGrid, SlotGridSkeleton } from '@/components/availability/SlotGrid';
import { LoadError } from '@/components/LoadError';
import { campusTime, campusToday, dayLabel, isTimeMark } from '@/domain/schedule';
import {
  durationLabel,
  rangeFromTimes,
  selectedInterval,
  selectSlot,
  type SelectedInterval,
  type SlotRange,
} from '@/domain/slot-selection';
import { useAvailability } from '@/hooks/useCatalog';
import { colors, layout, zIndex } from '@/theme/tokens';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

interface AvailabilitySectionProps {
  resourceId: number;
  resourceName: string;
  /** Ações sobre o intervalo escolhido (ex.: "Reservar este horário"). */
  renderActions?: (interval: SelectedInterval, date: string) => ReactNode;
}

/** Dia na URL (`?data=`), para o link do resultado da busca já abrir no dia certo. */
function useSelectedDate(): [string, string | null, string | null, (date: string) => void] {
  const [params, setParams] = useSearchParams();
  const today = campusToday();
  const raw = params.get('data');
  const date = raw && DATE_PATTERN.test(raw) && raw >= today ? raw : today;
  const inicio = params.get('inicio');
  const fim = params.get('fim');
  const setDate = (next: string) =>
    setParams(
      (current) => {
        const updated = new URLSearchParams(current);
        updated.set('data', next);
        updated.delete('inicio');
        updated.delete('fim');
        return updated;
      },
      { replace: true },
    );
  return [
    date,
    inicio && isTimeMark(inicio) ? inicio : null,
    fim && isTimeMark(fim) ? fim : null,
    setDate,
  ];
}

export function AvailabilitySection(props: AvailabilitySectionProps) {
  const [date, inicio, fim, setDate] = useSelectedDate();
  return (
    <DayAvailability
      key={date}
      {...props}
      date={date}
      inicio={inicio}
      fim={fim}
      setDate={setDate}
    />
  );
}

interface DayAvailabilityProps extends AvailabilitySectionProps {
  date: string;
  inicio: string | null;
  fim: string | null;
  setDate: (date: string) => void;
}

function DayAvailability({
  resourceId,
  resourceName,
  renderActions,
  date,
  inicio,
  fim,
  setDate,
}: DayAvailabilityProps) {
  const theme = useTheme();
  const compact = useMediaQuery(theme.breakpoints.down('md'));
  const query = useAvailability(resourceId, date);
  // `undefined` até a pessoa clicar: enquanto isso vale o intervalo que veio da busca.
  const [picked, setPicked] = useState<SlotRange | null | undefined>(undefined);

  const slots = query.data?.data === date ? query.data.slots : [];
  const selection = picked === undefined ? rangeFromTimes(slots, inicio, fim) : picked;
  const interval = selectedInterval(slots, selection);
  const loading = query.isPending || (query.isPlaceholderData && query.data?.data !== date);

  const summary = interval && (
    <Stack spacing={1.5}>
      <Box>
        <Typography variant="overline" component="p">
          Horário escolhido
        </Typography>
        <Typography sx={{ fontWeight: 700 }}>
          {campusTime(interval.inicio)} às {campusTime(interval.fim)} ·{' '}
          {durationLabel(interval.minutes)}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {dayLabel(date)} · {resourceName}
        </Typography>
      </Box>
      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }} useFlexGap>
        {renderActions?.(interval, date)}
        <Button variant="text" onClick={() => setPicked(null)}>
          Limpar seleção
        </Button>
      </Stack>
    </Stack>
  );

  return (
    <Box component="section" aria-labelledby="disponibilidade-titulo">
      <Typography id="disponibilidade-titulo" variant="h2" sx={{ mb: 1 }}>
        Horários
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 2, maxWidth: '65ch' }}>
        Toque no horário de início e depois no de fim. Cada bloco tem 30 minutos.
      </Typography>
      <Box sx={{ mb: 2 }}>
        <DayPicker value={date} onChange={setDate} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }} aria-live="polite">
          {dayLabel(date)}
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gap: 3,
          gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 480px) minmax(240px, 320px)' },
          alignItems: 'start',
        }}
      >
        <Box aria-busy={loading}>
          {query.isError && !query.data ? (
            <LoadError error={query.error} onRetry={() => void query.refetch()} />
          ) : loading ? (
            <SlotGridSkeleton />
          ) : slots.length === 0 ? (
            <Box
              sx={{ border: 1, borderColor: 'divider', backgroundColor: 'background.paper', p: 3 }}
            >
              <Typography>O campus não abre neste dia. Escolha outra data.</Typography>
            </Box>
          ) : (
            <SlotGrid
              slots={slots}
              selection={selection}
              onSelect={(index) => setPicked(selectSlot(slots, selection, index))}
            />
          )}
        </Box>

        {!compact && (
          <Box
            sx={{
              position: 'sticky',
              top: layout.topBarHeight + 24,
              border: 1,
              borderColor: 'divider',
              backgroundColor: 'background.paper',
              p: 2.5,
            }}
          >
            {summary ?? (
              <Typography color="text.secondary">
                Escolha um horário livre na grade para ver o resumo.
              </Typography>
            )}
          </Box>
        )}
      </Box>

      {compact && summary && (
        <Box
          component="section"
          aria-label="Horário escolhido"
          sx={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: layout.bottomNavHeight,
            zIndex: zIndex.stickyBar,
            backgroundColor: colors.surface,
            borderTop: `1px solid ${colors.lineStrong}`,
            px: 2,
            py: 1.5,
          }}
        >
          {summary}
        </Box>
      )}
      {/* Espaço para a barra fixa não cobrir o fim da grade no celular. */}
      {compact && summary && <Box sx={{ height: 160 }} />}
    </Box>
  );
}
