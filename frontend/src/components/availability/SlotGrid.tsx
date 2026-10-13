import CheckSharp from '@mui/icons-material/CheckSharp';
import EventBusySharp from '@mui/icons-material/EventBusySharp';
import HistorySharp from '@mui/icons-material/HistorySharp';
import PersonSharp from '@mui/icons-material/PersonSharp';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';

import { isSelected, type SlotRange } from '@/domain/slot-selection';
import { campusTime } from '@/domain/schedule';
import type { SlotRead } from '@/lib/api/types';
import { busyPattern } from '@/theme/patterns';
import { colors, fonts } from '@/theme/tokens';

interface SlotView {
  label: string;
  icon: ReactNode;
  sx: object;
}

function view(slot: SlotRead, selected: boolean): SlotView {
  if (selected) {
    return {
      label: 'Selecionado',
      icon: <CheckSharp sx={{ fontSize: 20 }} aria-hidden />,
      sx: { backgroundColor: colors.primary, color: colors.paper, borderColor: colors.primary },
    };
  }
  switch (slot.status) {
    case 'OCUPADO':
      return {
        label: slot.propria
          ? 'Sua reserva'
          : slot.reservado_por
            ? `Ocupado · ${slot.reservado_por}`
            : 'Ocupado',
        icon: slot.propria ? (
          <PersonSharp sx={{ fontSize: 20 }} aria-hidden />
        ) : (
          <EventBusySharp sx={{ fontSize: 20 }} aria-hidden />
        ),
        sx: { backgroundColor: colors.surface, backgroundImage: busyPattern, color: colors.ink },
      };
    case 'PASSADO':
      return {
        label: 'Encerrado',
        icon: <HistorySharp sx={{ fontSize: 20 }} aria-hidden />,
        sx: { backgroundColor: colors.sunken, color: colors.inkDisabled },
      };
    default:
      return {
        label: 'Livre',
        icon: null,
        sx: {
          backgroundColor: colors.surface,
          color: colors.ink,
          '&:hover': { backgroundColor: colors.primaryTint },
        },
      };
  }
}

interface SlotGridProps {
  slots: readonly SlotRead[];
  selection: SlotRange | null;
  onSelect: (index: number) => void;
}

/** Grade do dia em blocos de 30 minutos. Só os livres são clicáveis. */
export function SlotGrid({ slots, selection, onSelect }: SlotGridProps) {
  return (
    <Box component="ul" aria-label="Horários do dia" sx={{ m: 0, p: 0, listStyle: 'none' }}>
      {slots.map((slot, index) => {
        const selected = isSelected(selection, index);
        const { label, icon, sx } = view(slot, selected);
        const start = campusTime(slot.inicio);
        const end = campusTime(slot.fim);
        const free = slot.status === 'LIVRE';
        return (
          <li key={slot.inicio}>
            <ButtonBase
              onClick={() => onSelect(index)}
              disabled={!free}
              aria-pressed={free ? selected : undefined}
              aria-label={`${start} às ${end}, ${label.toLowerCase()}`}
              sx={{
                width: '100%',
                minHeight: 44,
                px: 2,
                display: 'flex',
                justifyContent: 'flex-start',
                gap: 2,
                border: 1,
                borderColor: 'divider',
                mt: index === 0 ? 0 : '-1px',
                textAlign: 'left',
                transition: 'none',
                ...sx,
                '&.Mui-disabled': sx,
              }}
            >
              <Typography
                component="span"
                sx={{ fontFamily: fonts.data, fontWeight: 500, minWidth: 48 }}
              >
                {start}
              </Typography>
              <Box
                component="span"
                sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}
              >
                {icon}
                <Typography
                  component="span"
                  variant="body2"
                  sx={{ fontWeight: selected ? 700 : 500, overflowWrap: 'anywhere' }}
                >
                  {label}
                </Typography>
              </Box>
            </ButtonBase>
          </li>
        );
      })}
    </Box>
  );
}

export function SlotGridSkeleton() {
  return (
    <Box aria-hidden>
      {Array.from({ length: 10 }, (_, index) => (
        <Skeleton key={index} variant="rectangular" height={44} sx={{ mt: index ? '-1px' : 0 }} />
      ))}
    </Box>
  );
}
