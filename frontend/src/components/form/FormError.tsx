import Alert from '@mui/material/Alert';

/** Erro do formulário inteiro (o que não pertence a um campo específico). */
export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <Alert severity="error" variant="outlined" role="alert">
      {message}
    </Alert>
  );
}
