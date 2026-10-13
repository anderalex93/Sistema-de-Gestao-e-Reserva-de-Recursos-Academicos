import AdminPanelSettingsSharp from '@mui/icons-material/AdminPanelSettingsSharp';
import EventNoteSharp from '@mui/icons-material/EventNoteSharp';
import HomeSharp from '@mui/icons-material/HomeSharp';
import PersonSharp from '@mui/icons-material/PersonSharp';
import SearchSharp from '@mui/icons-material/SearchSharp';
import type { SvgIconComponent } from '@mui/icons-material';

import { paths } from '@/router/paths';

export interface NavItem {
  label: string;
  shortLabel: string;
  to: string;
  icon: SvgIconComponent;
  end?: boolean;
}

export const primaryNav: readonly NavItem[] = [
  { label: 'Início', shortLabel: 'Início', to: paths.home, icon: HomeSharp, end: true },
  { label: 'Reservar', shortLabel: 'Reservar', to: paths.reserve, icon: SearchSharp },
  {
    label: 'Minhas reservas',
    shortLabel: 'Reservas',
    to: paths.myReservations,
    icon: EventNoteSharp,
  },
];

export const accountNav: NavItem = {
  label: 'Minha conta',
  shortLabel: 'Conta',
  to: paths.account,
  icon: PersonSharp,
};

export const adminNav: NavItem = {
  label: 'Administração',
  shortLabel: 'Admin',
  to: paths.admin,
  icon: AdminPanelSettingsSharp,
};
