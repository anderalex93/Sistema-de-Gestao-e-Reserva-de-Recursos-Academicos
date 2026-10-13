import type { RouteObject } from 'react-router';

import AppLayout from '@/layouts/AppLayout';
import PublicLayout from '@/layouts/PublicLayout';
import ErrorPage from '@/pages/ErrorPage';
import { AuthRoot, PublicOnly, RequireAuth, RequireRole } from '@/router/guards';
import {
  AccountPage,
  AdminPage,
  AdminUsersPage,
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
    element: <AuthRoot />,
    errorElement: <ErrorPage />,
    children: [
      {
        element: <PublicLayout />,
        children: [
          {
            element: <PublicOnly />,
            children: [
              { path: 'login', element: <LoginPage /> },
              { path: 'cadastro', element: <SignupPage /> },
            ],
          },
          { path: 'comprovantes/:codigo', element: <ReceiptPage /> },
        ],
      },
      {
        element: <RequireAuth />,
        children: [
          {
            element: <AppLayout />,
            children: [
              { index: true, element: <DashboardPage /> },
              { path: 'reservar', element: <ReservePage /> },
              { path: 'recursos/:id', element: <ResourcePage /> },
              { path: 'minhas-reservas', element: <MyReservationsPage /> },
              { path: 'conta', element: <AccountPage /> },
              {
                path: 'admin',
                element: <RequireRole roles={['ADMIN']} />,
                children: [
                  { index: true, element: <AdminPage /> },
                  { path: 'usuarios', element: <AdminUsersPage /> },
                ],
              },
              { path: '*', element: <NotFoundPage /> },
            ],
          },
        ],
      },
    ],
  },
];
