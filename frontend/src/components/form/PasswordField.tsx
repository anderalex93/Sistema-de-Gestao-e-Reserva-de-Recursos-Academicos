import VisibilityOffSharp from '@mui/icons-material/VisibilityOffSharp';
import VisibilitySharp from '@mui/icons-material/VisibilitySharp';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import { useState } from 'react';

import { FormTextField, type FormTextFieldProps } from '@/components/form/FormTextField';

export function PasswordField(props: Omit<FormTextFieldProps, 'type' | 'endAdornment'>) {
  const [visible, setVisible] = useState(false);

  return (
    <FormTextField
      {...props}
      type={visible ? 'text' : 'password'}
      endAdornment={
        <InputAdornment position="end">
          <IconButton
            aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
            aria-pressed={visible}
            onClick={() => setVisible((current) => !current)}
            edge="end"
          >
            {visible ? <VisibilityOffSharp /> : <VisibilitySharp />}
          </IconButton>
        </InputAdornment>
      }
    />
  );
}
