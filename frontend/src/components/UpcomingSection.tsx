import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

interface UpcomingSectionProps {
  issue: number;
  children: string;
}

/** Marca o lugar de uma tela que ainda será construída, apontando a issue responsável. */
export function UpcomingSection({ issue, children }: UpcomingSectionProps) {
  return (
    <Box
      sx={{
        border: 1,
        borderColor: 'divider',
        backgroundColor: 'background.paper',
        p: 3,
        maxWidth: '65ch',
      }}
    >
      <Typography>{children}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        Em construção na issue #{issue}.
      </Typography>
    </Box>
  );
}
