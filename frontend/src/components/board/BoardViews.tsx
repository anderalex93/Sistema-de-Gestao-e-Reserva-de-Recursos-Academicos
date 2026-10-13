import EventBusySharp from '@mui/icons-material/EventBusySharp';
import PersonSharp from '@mui/icons-material/PersonSharp';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { visuallyHidden } from '@mui/utils';
import type { ReactNode } from 'react';
import { Link as RouterLink } from 'react-router';

import {
  boardMarks,
  describeSegment,
  rowSegments,
  segmentLabels,
  type Segment,
  type SegmentKind,
} from '@/domain/board';
import { resourceTypeLabels } from '@/domain/resource-types';
import type { BoardRead } from '@/lib/api/types';
import { paths } from '@/router/paths';
import { busyPattern } from '@/theme/patterns';
import { colors, fonts } from '@/theme/tokens';

const SLOT_WIDTH = 28;

const kindSx: Record<SegmentKind, object> = {
  LIVRE: { backgroundColor: colors.surface },
  OCUPADO: { backgroundColor: colors.surface, backgroundImage: busyPattern },
  PROPRIA: { backgroundColor: colors.primaryTint, backgroundImage: busyPattern },
  PASSADO: { backgroundColor: colors.sunken, color: colors.inkDisabled },
};

const kindIcon: Partial<Record<SegmentKind, ReactNode>> = {
  OCUPADO: <EventBusySharp sx={{ fontSize: 16 }} aria-hidden />,
  PROPRIA: <PersonSharp sx={{ fontSize: 16 }} aria-hidden />,
};

type Line = BoardRead['linhas'][number];

function resourceLink(line: Line, date: string, segment?: Segment) {
  const params = new URLSearchParams({ data: date });
  if (segment) {
    params.set('inicio', segment.start);
    // Um bloco por padrão: a pessoa estende na grade do recurso.
    params.set('fim', segment.span > 1 ? nextMark(segment.start) : segment.end);
  }
  return `${paths.resource(line.recurso.id)}?${params.toString()}`;
}

function nextMark(time: string): string {
  const [hours = 0, minutes = 0] = time.split(':').map(Number);
  const total = hours * 60 + minutes + 30;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export function BoardLegend() {
  return (
    <Stack
      component="ul"
      aria-label="Legenda"
      direction="row"
      useFlexGap
      sx={{ flexWrap: 'wrap', gap: 2, m: 0, p: 0, listStyle: 'none' }}
    >
      {(Object.keys(segmentLabels) as SegmentKind[]).map((kind) => (
        <Stack key={kind} component="li" direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Box
            sx={{
              width: 20,
              height: 20,
              border: 1,
              borderColor: 'divider',
              display: 'grid',
              placeItems: 'center',
              ...kindSx[kind],
            }}
          >
            {kindIcon[kind]}
          </Box>
          <Typography variant="body2">{segmentLabels[kind]}</Typography>
        </Stack>
      ))}
    </Stack>
  );
}

interface BoardViewProps {
  board: BoardRead;
  now?: Date;
}

/** Desktop: recursos nas linhas, blocos de 30 minutos nas colunas. Só a tabela rola na horizontal. */
export function BoardTable({ board, now }: BoardViewProps) {
  if (!board.abertura || !board.fechamento) return null;
  const marks = boardMarks(board.abertura.slice(0, 5), board.fechamento.slice(0, 5));
  const hours = marks.filter((mark) => mark.endsWith(':00'));

  return (
    <Box sx={{ overflowX: 'auto', border: 1, borderColor: 'divider' }}>
      <Box
        component="table"
        aria-label="Quadro de horários"
        sx={{
          borderCollapse: 'collapse',
          tableLayout: 'fixed',
          minWidth: 220 + marks.length * SLOT_WIDTH,
          width: '100%',
          '& th, & td': { borderColor: colors.line, borderStyle: 'solid', borderWidth: 1, p: 0 },
        }}
      >
        <colgroup>
          <col style={{ width: 220 }} />
          {marks.map((mark) => (
            <col key={mark} style={{ width: SLOT_WIDTH }} />
          ))}
        </colgroup>
        <thead>
          <Box component="tr" sx={{ backgroundColor: colors.sunken }}>
            <Box component="th" scope="col" sx={{ textAlign: 'left', px: 1.5, py: 1 }}>
              Recurso
            </Box>
            {marks[0]?.endsWith(':30') && <th aria-hidden />}
            {hours.map((hour, index) => (
              <Box
                component="th"
                scope="colgroup"
                key={hour}
                colSpan={index === hours.length - 1 && marks.at(-1) === hour ? 1 : 2}
                sx={{ fontFamily: fonts.data, fontWeight: 500, fontSize: '0.75rem', py: 1 }}
              >
                {hour}
              </Box>
            ))}
          </Box>
        </thead>
        <tbody>
          {board.linhas.map((line) => (
            <tr key={line.recurso.id}>
              <Box
                component="th"
                scope="row"
                sx={{
                  position: 'sticky',
                  left: 0,
                  zIndex: 1,
                  backgroundColor: colors.surface,
                  textAlign: 'left',
                  px: 1.5,
                  py: 0.75,
                  fontWeight: 400,
                }}
              >
                <Link
                  component={RouterLink}
                  to={resourceLink(line, board.data)}
                  sx={{ fontWeight: 700 }}
                >
                  {line.recurso.nome}
                </Link>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                  {line.recurso.bloco.nome} · {resourceTypeLabels[line.recurso.tipo]}
                </Typography>
              </Box>
              {rowSegments(board.data, marks, line.ocupacoes, now).map((segment) => (
                <Box
                  component="td"
                  key={segment.start}
                  colSpan={segment.span}
                  title={describeSegment(segment)}
                  sx={{ height: 44, ...kindSx[segment.kind] }}
                >
                  {segment.kind === 'LIVRE' ? (
                    <Box
                      component={RouterLink}
                      to={resourceLink(line, board.data, segment)}
                      sx={{
                        display: 'block',
                        width: '100%',
                        height: '100%',
                        minHeight: 44,
                        '&:hover': { backgroundColor: colors.primaryTint },
                      }}
                    >
                      <Box component="span" sx={visuallyHidden}>
                        {`${line.recurso.nome}: ${describeSegment(segment)}`}
                      </Box>
                    </Box>
                  ) : (
                    <Stack
                      direction="row"
                      spacing={0.5}
                      sx={{
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        px: 0.5,
                      }}
                    >
                      {kindIcon[segment.kind]}
                      {segment.span >= 4 && segment.kind !== 'PASSADO' && (
                        <Typography
                          variant="body2"
                          sx={{ fontSize: '0.75rem', fontWeight: 500 }}
                          noWrap
                        >
                          {segmentLabels[segment.kind]}
                        </Typography>
                      )}
                      <Box component="span" sx={visuallyHidden}>
                        {describeSegment(segment)}
                      </Box>
                    </Stack>
                  )}
                </Box>
              ))}
            </tr>
          ))}
        </tbody>
      </Box>
    </Box>
  );
}

/** Celular: um bloco por recurso com as faixas do dia em texto. */
export function BoardList({ board, now }: BoardViewProps) {
  if (!board.abertura || !board.fechamento) return null;
  const marks = boardMarks(board.abertura.slice(0, 5), board.fechamento.slice(0, 5));

  return (
    <Box component="ul" aria-label="Quadro de horários" sx={{ m: 0, p: 0, listStyle: 'none' }}>
      {board.linhas.map((line, index) => (
        <Box
          component="li"
          key={line.recurso.id}
          sx={{
            border: 1,
            borderColor: 'divider',
            backgroundColor: 'background.paper',
            p: 2,
            mt: index === 0 ? 0 : '-1px',
          }}
        >
          <Link component={RouterLink} to={resourceLink(line, board.data)} sx={{ fontWeight: 700 }}>
            {line.recurso.nome}
          </Link>
          <Typography variant="body2" color="text.secondary">
            {line.recurso.bloco.nome} · {resourceTypeLabels[line.recurso.tipo]}
          </Typography>
          <Box component="ul" sx={{ m: 0, mt: 1, p: 0, listStyle: 'none' }}>
            {rowSegments(board.data, marks, line.ocupacoes, now).map((segment) => (
              <Stack
                component="li"
                key={segment.start}
                direction="row"
                spacing={1}
                sx={{ alignItems: 'center', minHeight: 32 }}
              >
                <Box
                  aria-hidden
                  sx={{
                    width: 16,
                    height: 16,
                    flexShrink: 0,
                    border: 1,
                    borderColor: 'divider',
                    ...kindSx[segment.kind],
                  }}
                />
                <Typography variant="body2" sx={{ fontFamily: fonts.data, minWidth: 104 }}>
                  {segment.start} às {segment.end}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: segment.kind === 'LIVRE' ? 400 : 700 }}
                >
                  {segmentLabels[segment.kind]}
                  {segment.reservadoPor ? ` · ${segment.reservadoPor}` : ''}
                </Typography>
              </Stack>
            ))}
          </Box>
        </Box>
      ))}
    </Box>
  );
}
