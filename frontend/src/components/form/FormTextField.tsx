import ErrorSharp from '@mui/icons-material/ErrorSharp';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import FormLabel from '@mui/material/FormLabel';
import OutlinedInput, { type OutlinedInputProps } from '@mui/material/OutlinedInput';
import type { UseFormRegisterReturn } from 'react-hook-form';

export interface FormTextFieldProps extends Omit<
  OutlinedInputProps,
  'error' | 'name' | 'onChange' | 'onBlur' | 'inputRef'
> {
  id: string;
  label: string;
  registration: UseFormRegisterReturn;
  error?: string;
  helperText?: string;
}

/** Campo com rótulo acima (design system, seção 8), ajuda e erro ligados por aria-describedby. */
export function FormTextField({
  id,
  label,
  registration,
  error,
  helperText,
  required,
  ...inputProps
}: FormTextFieldProps) {
  const { ref, ...field } = registration;
  const message = error ?? helperText;
  const messageId = message ? `${id}-mensagem` : undefined;

  return (
    <FormControl fullWidth error={Boolean(error)} required={required}>
      <FormLabel
        htmlFor={id}
        sx={{ mb: 0.75, fontWeight: 700, fontSize: '0.875rem', color: 'text.primary' }}
      >
        {label}
      </FormLabel>
      <OutlinedInput
        id={id}
        inputRef={ref}
        {...field}
        {...inputProps}
        slotProps={{
          input: { 'aria-describedby': messageId, 'aria-invalid': Boolean(error) },
        }}
      />
      {message && (
        <FormHelperText
          id={messageId}
          sx={{ mx: 0, mt: 0.75, display: 'flex', gap: 0.75, alignItems: 'flex-start' }}
        >
          {error && <ErrorSharp sx={{ fontSize: 16, mt: '2px' }} aria-hidden />}
          {message}
        </FormHelperText>
      )}
    </FormControl>
  );
}
