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
}

/** Dia anterior, campo de data e próximo dia. Não volta para antes de hoje. */
export function DayPicker({ value, onChange }: DayPickerProps) {
  const id = useId();
  const today = campusToday();
  const atToday = value <= today;

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
          if (event.target.value) onChange(event.target.value < today ? today : event.target.value);
        }}
        slotProps={{ input: { min: today, 'aria-label': 'Data' } }}
        sx={{ width: 180 }}
      />
      <Tooltip title="Próximo dia">
        <IconButton
          aria-label="Próximo dia"
          onClick={() => onChange(addDays(value, 1))}
          sx={{ width: 44, height: 44, border: 1, borderColor: 'divider' }}
        >
          <ChevronRightSharp />
        </IconButton>
      </Tooltip>
    </Stack>
  );
}
