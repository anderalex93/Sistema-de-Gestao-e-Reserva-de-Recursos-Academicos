import type { RouteObject } from 'react-router';

import AppLayout from '@/layouts/AppLayout';
import PublicLayout, { type PublicPageHandle } from '@/layouts/PublicLayout';
import ErrorPage, { PageError } from '@/pages/ErrorPage';
import { AuthRoot, PublicOnly, RequireAuth, RequireRole } from '@/router/guards';
import {
  AboutPage,
  AccountPage,
  AdminAgendaPage,
  AdminBuildingsPage,
  AdminOccupancyPage,
  AdminPage,
  AdminResourceQrPage,
  AdminResourcesPage,
  AdminUsersPage,
  BoardPage,
  CheckinPage,
  DashboardPage,
  HelpPage,
  LandingPage,
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

const wide: PublicPageHandle = { width: 'wide' };
const text: PublicPageHandle = { width: 'text' };

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
              { index: true, element: <LandingPage />, handle: wide },
              { path: 'login', element: <LoginPage /> },
              { path: 'cadastro', element: <SignupPage /> },
            ],
          },
          { path: 'sobre', element: <AboutPage />, handle: text },
          { path: 'ajuda', element: <HelpPage />, handle: text },
          { path: 'comprovantes/:codigo', element: <ReceiptPage /> },
          { path: 'privacidade', element: <PrivacyPage />, handle: text },
          { path: 'termos', element: <TermsPage />, handle: text },
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
                  { path: 'inicio', element: <DashboardPage /> },
                  { path: 'reservar', element: <ReservePage /> },
                  { path: 'quadro', element: <BoardPage /> },
                  { path: 'recursos/:id', element: <ResourcePage /> },
                  { path: 'minhas-reservas', element: <MyReservationsPage /> },
                  { path: 'checkin/:token', element: <CheckinPage /> },
                  { path: 'conta', element: <AccountPage /> },
                  {
                    path: 'admin',
                    element: <RequireRole roles={['ADMIN']} />,
                    children: [
                      { index: true, element: <AdminPage /> },
                      { path: 'usuarios', element: <AdminUsersPage /> },
                      { path: 'recursos', element: <AdminResourcesPage /> },
                      { path: 'recursos/:id/qr', element: <AdminResourceQrPage /> },
                      { path: 'blocos', element: <AdminBuildingsPage /> },
                      { path: 'agenda', element: <AdminAgendaPage /> },
                      { path: 'ocupacao', element: <AdminOccupancyPage /> },
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
