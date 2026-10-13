import ErrorSharp from '@mui/icons-material/ErrorSharp';
import Checkbox from '@mui/material/Checkbox';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import type { ReactNode } from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';

interface ConsentCheckboxProps {
  id: string;
  registration: UseFormRegisterReturn;
  error?: string;
  children: ReactNode;
}

/** Aceite explícito: nunca vem marcado, e o erro fica ligado ao campo (LGPD, Art. 8º). */
export function ConsentCheckbox({ id, registration, error, children }: ConsentCheckboxProps) {
  const { ref, ...field } = registration;
  const messageId = error ? `${id}-mensagem` : undefined;

  return (
    <FormControl error={Boolean(error)} required>
      <FormControlLabel
        sx={{ alignItems: 'flex-start', m: 0 }}
        control={
          <Checkbox
            id={id}
            {...field}
            sx={{ mt: -0.75, ml: -1 }}
            slotProps={{
              input: { ref, 'aria-describedby': messageId, 'aria-invalid': Boolean(error) },
            }}
          />
        }
        label={children}
      />
      {error && (
        <FormHelperText
          id={messageId}
          sx={{ mx: 0, mt: 0.75, display: 'flex', gap: 0.75, alignItems: 'flex-start' }}
        >
          <ErrorSharp sx={{ fontSize: 16, mt: '2px' }} aria-hidden />
          {error}
        </FormHelperText>
      )}
    </FormControl>
  );
}
