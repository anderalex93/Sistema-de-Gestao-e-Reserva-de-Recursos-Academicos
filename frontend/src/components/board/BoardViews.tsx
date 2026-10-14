import EventBusySharp from '@mui/icons-material/EventBusySharp';
import ExpandLessSharp from '@mui/icons-material/ExpandLessSharp';
import ExpandMoreSharp from '@mui/icons-material/ExpandMoreSharp';
import PersonSharp from '@mui/icons-material/PersonSharp';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { visuallyHidden } from '@mui/utils';
import type { ReactNode } from 'react';
import { Link as RouterLink } from 'react-router';

import {
  boardMarks,
  type BuildingGroup,
  describeSegment,
  groupByBuilding,
  reservedShare,
  rowSegments,
  segmentLabels,
  type Segment,
  type SegmentKind,
} from '@/domain/board';
import type { BoardRead } from '@/lib/api/types';
import { paths } from '@/router/paths';
import { busyPattern, touchTarget } from '@/theme/patterns';
import { colors, fonts } from '@/theme/tokens';

const SLOT_WIDTH = 28;
const NAME_WIDTH = 220;

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
    // Uma hora por padrão, o uso mais comum, quando a faixa livre comporta; a pessoa ajusta na
    // grade do recurso.
    params.set('fim', segment.span >= 2 ? laterMark(segment.start, 60) : segment.end);
  }
  return `${paths.resource(line.recurso.id)}?${params.toString()}`;
}

function laterMark(time: string, add: number): string {
  const [hours = 0, minutes = 0] = time.split(':').map(Number);
  const total = hours * 60 + minutes + add;
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

/** Quais blocos estão abertos no quadro; a página guarda o estado. */
export interface GroupToggle {
  isOpen: (buildingId: number) => boolean;
  toggle: (buildingId: number) => void;
}

interface BoardViewProps extends GroupToggle {
  board: BoardRead;
  now?: Date;
}

interface PreparedGroup extends BuildingGroup {
  rows: { line: Line; segments: Segment[] }[];
  reserved: number;
}

function prepare(board: BoardRead, marks: string[], now?: Date): PreparedGroup[] {
  return groupByBuilding(board.linhas).map(({ bloco, linhas }) => ({
    bloco,
    linhas,
    rows: linhas.map((line) => ({
      line,
      segments: rowSegments(board.data, marks, line.ocupacoes, now),
    })),
    reserved: reservedShare(board.data, marks, linhas),
  }));
}

function groupSummary(group: PreparedGroup): string {
  const total = group.rows.length;
  const spaces = total === 1 ? '1 espaço' : `${total} espaços`;
  return `${spaces}, ${Math.round(group.reserved * 100)}% do dia reservado`;
}

/** Cabeçalho de um bloco: abre e fecha as linhas dele. */
function GroupButton({
  group,
  open,
  onToggle,
}: {
  group: PreparedGroup;
  open: boolean;
  onToggle: () => void;
}) {
  const Icon = open ? ExpandLessSharp : ExpandMoreSharp;
  return (
    <ButtonBase
      onClick={onToggle}
      aria-expanded={open}
      disableRipple
      sx={{
        width: '100%',
        minHeight: 44,
        px: 1.5,
        justifyContent: 'flex-start',
        gap: 1,
        textAlign: 'left',
        font: 'inherit',
        '&:hover': { color: colors.primary },
        '&.Mui-focusVisible': { outline: `2px solid ${colors.focus}`, outlineOffset: -2 },
      }}
    >
      <Icon sx={{ fontSize: 20 }} aria-hidden />
      <Typography component="span" sx={{ fontWeight: 700 }}>
        {group.bloco.nome}
      </Typography>
      <Typography component="span" variant="body2" color="text.secondary">
        {groupSummary(group)}
      </Typography>
    </ButtonBase>
  );
}

/**
 * Desktop: recursos nas linhas, agrupados por bloco, e blocos de 30 minutos nas colunas. A
 * tabela rola dentro da própria área, com a linha das horas e a coluna dos nomes sempre à vista.
 */
export function BoardTable({ board, now, isOpen, toggle }: BoardViewProps) {
  if (!board.abertura || !board.fechamento) return null;
  const marks = boardMarks(board.abertura.slice(0, 5), board.fechamento.slice(0, 5));
  const hours = marks.filter((mark) => mark.endsWith(':00'));
  const groups = prepare(board, marks, now);

  return (
    <Box
      component="section"
      aria-label="Área do quadro"
      tabIndex={0}
      sx={{
        overflow: 'auto',
        maxHeight: 'calc(100vh - 160px)',
        minHeight: 320,
        border: 1,
        borderColor: 'divider',
        '&:focus-visible': { outline: `2px solid ${colors.focus}`, outlineOffset: 2 },
      }}
    >
      <Box
        component="table"
        aria-label="Quadro de horários"
        sx={{
          borderCollapse: 'separate',
          borderSpacing: 0,
          tableLayout: 'fixed',
          minWidth: NAME_WIDTH + marks.length * SLOT_WIDTH,
          width: '100%',
          '& th, & td': {
            borderColor: colors.line,
            borderStyle: 'solid',
            borderWidth: '0 1px 1px 0',
            p: 0,
          },
        }}
      >
        <colgroup>
          <col style={{ width: NAME_WIDTH }} />
          {marks.map((mark) => (
            <col key={mark} style={{ width: SLOT_WIDTH }} />
          ))}
        </colgroup>
        <Box
          component="thead"
          sx={{
            '& th': { position: 'sticky', top: 0, zIndex: 2, backgroundColor: colors.sunken },
          }}
        >
          <tr>
            <Box
              component="th"
              scope="col"
              sx={{ textAlign: 'left', px: 1.5, py: 1, left: 0, zIndex: '3 !important' }}
            >
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
          </tr>
        </Box>
        {groups.map((group) => {
          const open = isOpen(group.bloco.id);
          return (
            <tbody key={group.bloco.id}>
              <tr>
                <Box
                  component="th"
                  scope="colgroup"
                  colSpan={1 + marks.length}
                  sx={{ backgroundColor: colors.paper, textAlign: 'left' }}
                >
                  {/* O botão acompanha a rolagem horizontal, como a coluna dos nomes. */}
                  <Box sx={{ position: 'sticky', left: 0, display: 'inline-block' }}>
                    <GroupButton
                      group={group}
                      open={open}
                      onToggle={() => toggle(group.bloco.id)}
                    />
                  </Box>
                </Box>
              </tr>
              {open &&
                group.rows.map(({ line, segments }) => (
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
                        fontWeight: 400,
                      }}
                    >
                      <Link
                        component={RouterLink}
                        to={resourceLink(line, board.data)}
                        sx={{ ...touchTarget, fontWeight: 700 }}
                        noWrap
                      >
                        {line.recurso.nome}
                      </Link>
                    </Box>
                    {segments.map((segment) => (
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
          );
        })}
      </Box>
    </Box>
  );
}

/** Celular: os mesmos blocos que abrem e fecham, e as faixas de cada recurso em texto. */
export function BoardList({ board, now, isOpen, toggle }: BoardViewProps) {
  if (!board.abertura || !board.fechamento) return null;
  const marks = boardMarks(board.abertura.slice(0, 5), board.fechamento.slice(0, 5));
  const groups = prepare(board, marks, now);

  return (
    <Box aria-label="Quadro de horários" component="section">
      {groups.map((group, groupIndex) => {
        const open = isOpen(group.bloco.id);
        return (
          <Box
            key={group.bloco.id}
            sx={{
              border: 1,
              borderColor: 'divider',
              mt: groupIndex === 0 ? 0 : '-1px',
              backgroundColor: colors.paper,
            }}
          >
            <GroupButton group={group} open={open} onToggle={() => toggle(group.bloco.id)} />
            {open && (
              <Box
                component="ul"
                aria-label={group.bloco.nome}
                sx={{ m: 0, p: 0, listStyle: 'none' }}
              >
                {group.rows.map(({ line, segments }) => (
                  <Box
                    component="li"
                    key={line.recurso.id}
                    sx={{
                      borderTop: 1,
                      borderColor: 'divider',
                      backgroundColor: 'background.paper',
                      p: 2,
                    }}
                  >
                    <Link
                      component={RouterLink}
                      to={resourceLink(line, board.data)}
                      sx={{ ...touchTarget, fontWeight: 700 }}
                    >
                      {line.recurso.nome}
                    </Link>
                    <Box component="ul" sx={{ m: 0, mt: 1, p: 0, listStyle: 'none' }}>
                      {segments.map((segment) => (
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
                          <Typography
                            variant="body2"
                            sx={{ fontFamily: fonts.data, minWidth: 104 }}
                          >
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
            )}
          </Box>
        );
      })}
    </Box>
  );
}
