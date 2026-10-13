import 'dayjs/locale/pt-br';

import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router';

import { FeedbackProvider } from '@/contexts/FeedbackContext';
import { createQueryClient } from '@/lib/query-client';
import { routes } from '@/router/routes';
import { createAppTheme } from '@/theme/theme';

const theme = createAppTheme();

interface AppProvidersProps {
  queryClient: QueryClient;
  children: ReactNode;
}

/** Providers globais, compartilhados entre a aplicação e os testes. */
export function AppProviders({ queryClient, children }: AppProvidersProps) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
        <QueryClientProvider client={queryClient}>
          <FeedbackProvider>{children}</FeedbackProvider>
        </QueryClientProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default function App() {
  const [router] = useState(() => createBrowserRouter(routes));
  const [queryClient] = useState(createQueryClient);

  return (
    <AppProviders queryClient={queryClient}>
      <RouterProvider router={router} />
    </AppProviders>
  );
}
