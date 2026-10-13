import type { RouteObject } from 'react-router';

import AppLayout from '@/layouts/AppLayout';
import PublicLayout from '@/layouts/PublicLayout';
import ErrorPage, { PageError } from '@/pages/ErrorPage';
import { AuthRoot, PublicOnly, RequireAuth, RequireRole } from '@/router/guards';
import {
  AccountPage,
  AdminAgendaPage,
  AdminBuildingsPage,
  AdminPage,
  AdminResourcesPage,
  AdminUsersPage,
  BoardPage,
  DashboardPage,
  LoginPage,
  MyReservationsPage,
  NotFoundPage,
  PrivacyPage,
  ReceiptPage,
  ReservePage,
  ResourcePage,
  SignupPage,
  TermsPage,
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
          { path: 'privacidade', element: <PrivacyPage /> },
          { path: 'termos', element: <TermsPage /> },
        ],
      },
      {
        element: <RequireAuth />,
        children: [
          {
            element: <AppLayout />,
            children: [
              {
                // Erro numa página fica dentro do layout: a navegação continua disponível.
                errorElement: <PageError />,
                children: [
                  { index: true, element: <DashboardPage /> },
                  { path: 'reservar', element: <ReservePage /> },
                  { path: 'quadro', element: <BoardPage /> },
                  { path: 'recursos/:id', element: <ResourcePage /> },
                  { path: 'minhas-reservas', element: <MyReservationsPage /> },
                  { path: 'conta', element: <AccountPage /> },
                  {
                    path: 'admin',
                    element: <RequireRole roles={['ADMIN']} />,
                    children: [
                      { index: true, element: <AdminPage /> },
                      { path: 'usuarios', element: <AdminUsersPage /> },
                      { path: 'recursos', element: <AdminResourcesPage /> },
                      { path: 'blocos', element: <AdminBuildingsPage /> },
                      { path: 'agenda', element: <AdminAgendaPage /> },
                    ],
                  },
                  { path: '*', element: <NotFoundPage /> },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];
