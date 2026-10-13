import { lazy } from 'react';

/** Páginas carregadas sob demanda (um chunk por rota). */
export const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
export const ReservePage = lazy(() => import('@/pages/ReservePage'));
export const BoardPage = lazy(() => import('@/pages/BoardPage'));
export const ResourcePage = lazy(() => import('@/pages/ResourcePage'));
export const MyReservationsPage = lazy(() => import('@/pages/MyReservationsPage'));
export const AccountPage = lazy(() => import('@/pages/AccountPage'));
export const AdminPage = lazy(() => import('@/pages/AdminPage'));
export const LoginPage = lazy(() => import('@/pages/LoginPage'));
export const SignupPage = lazy(() => import('@/pages/SignupPage'));
export const ReceiptPage = lazy(() => import('@/pages/ReceiptPage'));
export const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));
export const AdminUsersPage = lazy(() => import('@/pages/AdminUsersPage'));
