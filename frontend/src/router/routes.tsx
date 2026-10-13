import type { RouteObject } from 'react-router';

import AppLayout from '@/layouts/AppLayout';
import PublicLayout from '@/layouts/PublicLayout';
import ErrorPage from '@/pages/ErrorPage';
import {
  AccountPage,
  AdminPage,
  DashboardPage,
  LoginPage,
  MyReservationsPage,
  NotFoundPage,
  ReceiptPage,
  ReservePage,
  ResourcePage,
  SignupPage,
} from '@/router/lazy-pages';

export const routes: RouteObject[] = [
  {
    errorElement: <ErrorPage />,
    children: [
      {
        element: <PublicLayout />,
        children: [
          { path: 'login', element: <LoginPage /> },
          { path: 'cadastro', element: <SignupPage /> },
          { path: 'comprovantes/:codigo', element: <ReceiptPage /> },
        ],
      },
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'reservar', element: <ReservePage /> },
          { path: 'recursos/:id', element: <ResourcePage /> },
          { path: 'minhas-reservas', element: <MyReservationsPage /> },
          { path: 'conta', element: <AccountPage /> },
          { path: 'admin/*', element: <AdminPage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
];
