import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useSearchParams } from 'react-router';

import { DayPicker } from '@/components/availability/DayPicker';
import { BoardLegend, BoardList, BoardTable } from '@/components/board/BoardViews';
import { LoadError } from '@/components/LoadError';
import { PageHeader } from '@/components/PageHeader';
import { resourceTypeLabels } from '@/domain/resource-types';
import { campusToday, dayLabel } from '@/domain/schedule';
import { useBoard } from '@/hooks/useBoard';
import { useBuildings } from '@/hooks/useCatalog';
import type { BoardParams } from '@/lib/api/board.api';
import type { ResourceType } from '@/lib/api/types';
import { loadFailure } from '@/lib/load-failure';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const labelSx = { mb: 0.75, fontWeight: 700, fontSize: '0.875rem', color: 'text.primary' };
const panelSx = { border: 1, borderColor: 'divider', backgroundColor: 'background.paper', p: 3 };

function readParams(params: URLSearchParams): BoardParams {
  const today = campusToday();
  const data = params.get('data');
  const bloco = Number(params.get('bloco_id'));
  const tipo = params.get('tipo');
  return {
    data: data && DATE_PATTERN.test(data) && data >= today ? data : today,
    ...(Number.isInteger(bloco) && bloco > 0 ? { bloco_id: bloco } : {}),
    ...(tipo && Object.hasOwn(resourceTypeLabels, tipo) ? { tipo: tipo as ResourceType } : {}),
  };
}

export default function BoardPage() {
  const theme = useTheme();
  const compact = useMediaQuery(theme.breakpoints.down('md'));
  const [urlParams, setUrlParams] = useSearchParams();
  const params = readParams(urlParams);
  const query = useBoard(params);
  const buildings = useBuildings();

  const update = (patch: Record<string, string | null>) =>
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

  // Enquanto o novo dia carrega, não mostra o quadro do dia anterior com o rótulo errado.
  const board = query.data?.data === params.data ? query.data : undefined;

  return (
    <>
      <PageHeader
        title="Quadro de horários"
        description="O que já está reservado em cada espaço e equipamento, dia a dia."
      />

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        useFlexGap
        sx={{ mb: 2, flexWrap: 'wrap', alignItems: { sm: 'flex-end' } }}
      >
        <Box>
          <Typography sx={labelSx}>Dia</Typography>
          <DayPicker value={params.data} onChange={(data) => update({ data })} />
        </Box>
        <FormControl sx={{ minWidth: 180 }}>
          <FormLabel id="quadro-bloco-rotulo" sx={labelSx}>
            Bloco
          </FormLabel>
          <Select
            labelId="quadro-bloco-rotulo"
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
        </FormControl>
        <FormControl sx={{ minWidth: 180 }}>
          <FormLabel id="quadro-tipo-rotulo" sx={labelSx}>
            Tipo
          </FormLabel>
          <Select
            labelId="quadro-tipo-rotulo"
            value={params.tipo ?? ''}
            onChange={(event) => update({ tipo: event.target.value || null })}
            displayEmpty
          >
            <MenuItem value="">Todos os tipos</MenuItem>
            {Object.entries(resourceTypeLabels).map(([value, label]) => (
              <MenuItem key={value} value={value}>
                {label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      <Stack spacing={1} sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary" aria-live="polite">
          {dayLabel(params.data)}
        </Typography>
        <BoardLegend />
      </Stack>

      {loadFailure(query) ? (
        <LoadError error={loadFailure(query)} onRetry={() => void query.refetch()} />
      ) : !board ? (
        <Box aria-busy="true" aria-label="Carregando quadro">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton
              key={index}
              variant="rectangular"
              height={52}
              sx={{ mt: index ? '-1px' : 0 }}
            />
          ))}
        </Box>
      ) : !board.abertura ? (
        <Box sx={panelSx}>
          <Typography>O campus não abre neste dia. Escolha outra data.</Typography>
        </Box>
      ) : board.linhas.length === 0 ? (
        <Box sx={panelSx}>
          <Typography>Nenhum recurso com esses filtros.</Typography>
        </Box>
      ) : compact ? (
        <BoardList board={board} />
      ) : (
        <BoardTable board={board} />
      )}
    </>
  );
}
