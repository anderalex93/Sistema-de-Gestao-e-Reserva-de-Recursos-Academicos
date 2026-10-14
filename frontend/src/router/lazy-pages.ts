import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

interface PageModule {
  default: ComponentType;
}

/** Página carregada sob demanda que também pode ser baixada antes de renderizar. */
export type PreloadablePage = LazyExoticComponent<ComponentType> & {
  preload: () => Promise<PageModule>;
};

function page(load: () => Promise<PageModule>): PreloadablePage {
  return Object.assign(lazy(load), { preload: load });
}

/** Páginas carregadas sob demanda (um chunk por rota). */
export const DashboardPage = page(() => import('@/pages/DashboardPage'));
export const ReservePage = page(() => import('@/pages/ReservePage'));
export const BoardPage = page(() => import('@/pages/BoardPage'));
export const ResourcePage = page(() => import('@/pages/ResourcePage'));
export const MyReservationsPage = page(() => import('@/pages/MyReservationsPage'));
export const AccountPage = page(() => import('@/pages/AccountPage'));
export const AdminPage = page(() => import('@/pages/AdminPage'));
export const LandingPage = page(() => import('@/pages/LandingPage'));
export const AboutPage = page(() => import('@/pages/AboutPage'));
export const HelpPage = page(() => import('@/pages/HelpPage'));
export const LoginPage = page(() => import('@/pages/LoginPage'));
export const SignupPage = page(() => import('@/pages/SignupPage'));
export const ReceiptPage = page(() => import('@/pages/ReceiptPage'));
export const CheckinPage = page(() => import('@/pages/CheckinPage'));
export const NotFoundPage = page(() => import('@/pages/NotFoundPage'));
export const AdminUsersPage = page(() => import('@/pages/AdminUsersPage'));
export const AdminResourcesPage = page(() => import('@/pages/AdminResourcesPage'));
export const AdminResourceQrPage = page(() => import('@/pages/AdminResourceQrPage'));
export const AdminBuildingsPage = page(() => import('@/pages/AdminBuildingsPage'));
export const AdminAgendaPage = page(() => import('@/pages/AdminAgendaPage'));
export const AdminOccupancyPage = page(() => import('@/pages/AdminOccupancyPage'));
export const AdminSettingsPage = page(() => import('@/pages/AdminSettingsPage'));
export const PrivacyPage = page(() => import('@/pages/PrivacyPage'));
export const TermsPage = page(() => import('@/pages/TermsPage'));
