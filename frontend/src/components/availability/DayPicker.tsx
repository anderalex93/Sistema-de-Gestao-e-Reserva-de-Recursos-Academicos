import ChevronLeftSharp from '@mui/icons-material/ChevronLeftSharp';
import ChevronRightSharp from '@mui/icons-material/ChevronRightSharp';
import IconButton from '@mui/material/IconButton';
import OutlinedInput from '@mui/material/OutlinedInput';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import { useId } from 'react';

import { addDays, campusToday } from '@/domain/schedule';

interface DayPickerProps {
  value: string;
  onChange: (date: string) => void;
  /** Última data permitida; sem ela, o próximo dia nunca é bloqueado. */
  max?: string;
}

/** Dia anterior, campo de data e próximo dia. Não volta para antes de hoje. */
export function DayPicker({ value, onChange, max }: DayPickerProps) {
  const id = useId();
  const today = campusToday();
  const atToday = value <= today;
  const atMax = max !== undefined && value >= max;

  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
      <Tooltip title="Dia anterior">
        <span>
          <IconButton
            aria-label="Dia anterior"
            disabled={atToday}
            onClick={() => onChange(addDays(value, -1))}
            sx={{ width: 44, height: 44, border: 1, borderColor: 'divider' }}
          >
            <ChevronLeftSharp />
          </IconButton>
        </span>
      </Tooltip>
      <OutlinedInput
        id={id}
        type="date"
        value={value}
        onChange={(event) => {
          const picked = event.target.value;
          if (!picked) return;
          if (picked < today) onChange(today);
          else if (max && picked > max) onChange(max);
          else onChange(picked);
        }}
        slotProps={{ input: { min: today, max, 'aria-label': 'Data' } }}
        sx={{ width: 180 }}
      />
      <Tooltip title="Próximo dia">
        <span>
          <IconButton
            aria-label="Próximo dia"
            disabled={atMax}
            onClick={() => onChange(addDays(value, 1))}
            sx={{ width: 44, height: 44, border: 1, borderColor: 'divider' }}
          >
            <ChevronRightSharp />
          </IconButton>
        </span>
      </Tooltip>
    </Stack>
  );
}
