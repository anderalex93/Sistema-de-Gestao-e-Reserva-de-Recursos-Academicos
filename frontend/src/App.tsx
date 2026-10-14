import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router';

import { ConsentProvider } from '@/contexts/ConsentProvider';
import { FeedbackProvider } from '@/contexts/FeedbackContext';
import { analytics, consentStore } from '@/lib/analytics';
import { createQueryClient } from '@/lib/query-client';
import { preloadPages } from '@/router/preload';
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
      <QueryClientProvider client={queryClient}>
        <FeedbackProvider>
          <ConsentProvider analytics={analytics} store={consentStore}>
            {children}
          </ConsentProvider>
        </FeedbackProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default function App() {
  const [router] = useState(() => {
    preloadPages(routes, window.location.pathname);
    return createBrowserRouter(routes);
  });
  const [queryClient] = useState(createQueryClient);

  return (
    <AppProviders queryClient={queryClient}>
      <RouterProvider router={router} />
    </AppProviders>
  );
}
