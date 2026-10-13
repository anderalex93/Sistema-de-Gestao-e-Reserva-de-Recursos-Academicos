import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { ApiError } from '@/lib/api/api-error';

interface LoadErrorProps {
  error: unknown;
  onRetry: () => void;
}

/** Erro de carregamento (design system, Feedback): mensagem simples e "Tentar de novo". */
export function LoadError({ error, onRetry }: LoadErrorProps) {
  return (
    <Box
      role="alert"
      sx={{ border: 1, borderColor: 'divider', backgroundColor: 'background.paper', p: 3 }}
    >
      <Typography>{ApiError.from(error).message}</Typography>
      <Button variant="outlined" sx={{ mt: 2 }} onClick={onRetry}>
        Tentar de novo
      </Button>
    </Box>
  );
}
