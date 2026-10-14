import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { visuallyHidden } from '@mui/utils';
import type { ReactNode } from 'react';

import {
  HEAT_LEGEND,
  heatStep,
  hourLabel,
  hours,
  percent,
  WEEKDAY_LABELS,
  WEEKDAY_NAMES,
} from '@/domain/occupancy';
import { resourceTypeLabels } from '@/domain/resource-types';
import type { HeatmapCellRead, ResourceOccupancyRead } from '@/lib/api/types';
import { colors, fonts } from '@/theme/tokens';

const panelSx = { border: 1, borderColor: 'divider', backgroundColor: 'background.paper' };

interface StatTileProps {
  label: string;
  value: string;
  detail: ReactNode;
}

/** Um número por bloco: rótulo, valor grande em fonte de dados e o que ele significa. */
export function StatTile({ label, value, detail }: StatTileProps) {
  return (
    <Box sx={{ ...panelSx, p: 2.5 }}>
      <Typography variant="overline" component="p">
        {label}
      </Typography>
      <Typography
        component="p"
        sx={{ fontFamily: fonts.data, fontSize: '2.25rem', lineHeight: 1.2, fontWeight: 500 }}
      >
        {value}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
        {detail}
      </Typography>
    </Box>
  );
}

function HeatLegend() {
  return (
    <Stack
      component="ul"
      direction="row"
      useFlexGap
      sx={{
        flexWrap: 'wrap',
        gap: 1.5,
        alignItems: 'center',
        mt: 1.5,
        mb: 0,
        p: 0,
        listStyle: 'none',
      }}
      aria-label="Legenda do mapa de calor"
    >
      {HEAT_LEGEND.map((step) => (
        <Stack
          component="li"
          key={step.label}
          direction="row"
          spacing={0.75}
          sx={{ alignItems: 'center' }}
        >
          <Box
            aria-hidden
            sx={{
              width: 20,
              height: 20,
              backgroundColor: step.background,
              border: `1px solid ${colors.line}`,
            }}
          />
          <Typography variant="body2" color="text.secondary">
            {step.label}
          </Typography>
        </Stack>
      ))}
    </Stack>
  );
}

/**
 * Mapa de calor da semana: horas nas linhas e dias nas colunas (cabe no celular). Cada célula
 * traz o número escrito, então a cor nunca é a única forma de ler; e é uma tabela de verdade
 * para leitores de tela.
 */
export function OccupancyHeatmap({ cells }: { cells: readonly HeatmapCellRead[] }) {
  const days = [...new Set(cells.map((cell) => cell.dia_semana))].sort((a, b) => a - b);
  const hourList = [...new Set(cells.map((cell) => cell.hora))].sort((a, b) => a - b);
  const byKey = new Map(cells.map((cell) => [`${cell.dia_semana}-${cell.hora}`, cell.taxa]));

  if (cells.length === 0) {
    return (
      <Typography color="text.secondary">O campus não abre em nenhum dia deste período.</Typography>
    );
  }

  return (
    <Box>
      <Box
        component="table"
        sx={{
          borderCollapse: 'separate',
          borderSpacing: '2px',
          width: '100%',
          maxWidth: 640,
          tableLayout: 'fixed',
        }}
      >
        <caption style={{ captionSide: 'top', textAlign: 'left' }}>
          <Typography variant="body2" color="text.secondary" component="span">
            Parte do tempo disponível que ficou reservada, por dia da semana e hora.
          </Typography>
        </caption>
        <thead>
          <tr>
            <Box component="th" scope="col" sx={{ width: 52 }}>
              <Box component="span" sx={visuallyHidden}>
                Hora
              </Box>
            </Box>
            {days.map((day) => (
              <Box
                component="th"
                scope="col"
                key={day}
                abbr={WEEKDAY_NAMES[day]}
                sx={{ fontSize: '0.8125rem', fontWeight: 700, py: 0.5 }}
              >
                {WEEKDAY_LABELS[day]}
              </Box>
            ))}
          </tr>
        </thead>
        <tbody>
          {hourList.map((hour) => (
            <tr key={hour}>
              <Box
                component="th"
                scope="row"
                sx={{
                  fontFamily: fonts.data,
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  textAlign: 'left',
                  color: 'text.secondary',
                }}
              >
                {hourLabel(hour)}
              </Box>
              {days.map((day) => {
                const rate = byKey.get(`${day}-${hour}`);
                if (rate === undefined) {
                  return (
                    <Box
                      component="td"
                      key={day}
                      sx={{ backgroundColor: colors.sunken, height: 36 }}
                    >
                      <Box component="span" sx={visuallyHidden}>
                        Fechado
                      </Box>
                    </Box>
                  );
                }
                const step = heatStep(rate);
                return (
                  <Box
                    component="td"
                    key={day}
                    title={`${WEEKDAY_NAMES[day]}, ${hourLabel(hour)}: ${percent(rate)} ocupado`}
                    sx={{
                      height: 36,
                      textAlign: 'center',
                      backgroundColor: step.background,
                      color: step.text,
                      border: rate > 0 ? 'none' : `1px solid ${colors.line}`,
                      fontFamily: fonts.data,
                      fontSize: '0.75rem',
                      fontWeight: 500,
                    }}
                  >
                    {percent(rate)}
                  </Box>
                );
              })}
            </tr>
          ))}
        </tbody>
      </Box>
      <HeatLegend />
    </Box>
  );
}

/** Lista ordenada com barra fina: nome à esquerda, taxa escrita à direita. */
export function RankedBars({
  title,
  items,
  empty,
}: {
  title: string;
  items: readonly ResourceOccupancyRead[];
  empty: string;
}) {
  const id = `ranking-${title.toLowerCase().replaceAll(' ', '-')}`;
  return (
    <Box component="section" aria-labelledby={id} sx={{ ...panelSx, p: 2.5 }}>
      <Typography id={id} variant="h3" component="h2" sx={{ mb: 1.5 }}>
        {title}
      </Typography>
      {items.length === 0 ? (
        <Typography color="text.secondary">{empty}</Typography>
      ) : (
        <Box component="ol" sx={{ m: 0, p: 0, listStyle: 'none', display: 'grid', gap: 1.5 }}>
          {items.map((item) => (
            <Box component="li" key={item.id}>
              <Stack direction="row" sx={{ justifyContent: 'space-between', gap: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 700, minWidth: 0 }} noWrap>
                  {item.nome}
                  <Box component="span" sx={{ fontWeight: 400, color: 'text.secondary' }}>
                    {' '}
                    · {item.bloco}
                  </Box>
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: fonts.data, fontWeight: 500 }}>
                  {percent(item.taxa_ocupacao)}
                </Typography>
              </Stack>
              <Box aria-hidden sx={{ mt: 0.5, height: 6, backgroundColor: colors.sunken }}>
                <Box
                  sx={{
                    height: '100%',
                    width: `${Math.min(100, item.taxa_ocupacao * 100)}%`,
                    backgroundColor: colors.primary,
                  }}
                />
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}

/** Todos os recursos do filtro, com os números do CSV. */
export function ResourceOccupancyTable({ items }: { items: readonly ResourceOccupancyRead[] }) {
  return (
    // Rola de lado no celular: focável e com nome, para quem navega pelo teclado (WCAG 2.1.1).
    <Box
      component="section"
      aria-label="Tabela de ocupação por recurso"
      tabIndex={0}
      sx={{ ...panelSx, overflowX: 'auto' }}
    >
      <Table aria-label="Ocupação por recurso" size="small">
        <TableHead>
          <TableRow>
            <TableCell>Recurso</TableCell>
            <TableCell>Tipo</TableCell>
            <TableCell align="right">Ocupação</TableCell>
            <TableCell align="right">Horas reservadas</TableCell>
            <TableCell align="right">Reservas</TableCell>
            <TableCell align="right">Cancelamentos</TableCell>
            <TableCell align="right">Não compareceram</TableCell>
            <TableCell align="right">Horas devolvidas</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <Box sx={{ fontWeight: 700 }}>{item.nome}</Box>
                <Box sx={{ color: 'text.secondary' }}>{item.bloco}</Box>
              </TableCell>
              <TableCell>{resourceTypeLabels[item.tipo]}</TableCell>
              <TableCell align="right" sx={{ fontFamily: fonts.data }}>
                {percent(item.taxa_ocupacao)}
              </TableCell>
              <TableCell align="right" sx={{ fontFamily: fonts.data }}>
                {hours(item.horas_reservadas)}
              </TableCell>
              <TableCell align="right" sx={{ fontFamily: fonts.data }}>
                {item.reservas}
              </TableCell>
              <TableCell align="right" sx={{ fontFamily: fonts.data }}>
                {item.cancelamentos}
              </TableCell>
              <TableCell align="right" sx={{ fontFamily: fonts.data }}>
                {item.nao_comparecimentos}
              </TableCell>
              <TableCell align="right" sx={{ fontFamily: fonts.data }}>
                {hours(item.horas_devolvidas)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}

/** Celular: só nome, bloco e ocupação; os demais números ficam na tabela do computador e no CSV. */
export function ResourceOccupancyList({ items }: { items: readonly ResourceOccupancyRead[] }) {
  return (
    <Box
      component="ol"
      aria-label="Ocupação por recurso"
      sx={{ ...panelSx, m: 0, p: 0, listStyle: 'none' }}
    >
      {items.map((item, index) => (
        <Stack
          component="li"
          key={item.id}
          direction="row"
          sx={{
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2,
            px: 2,
            py: 1.25,
            borderTop: index === 0 ? 0 : `1px solid ${colors.line}`,
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700 }}>{item.nome}</Typography>
            <Typography variant="body2" color="text.secondary">
              {item.bloco} · {item.reservas} reservas · {item.nao_comparecimentos} sem check-in
            </Typography>
          </Box>
          <Typography sx={{ fontFamily: fonts.data, fontWeight: 500 }}>
            {percent(item.taxa_ocupacao)}
          </Typography>
        </Stack>
      ))}
    </Box>
  );
}
