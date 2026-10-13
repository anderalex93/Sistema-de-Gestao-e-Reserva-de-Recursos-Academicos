import type { UserRole } from '@/lib/api/types';

export const roleLabels: Record<UserRole, string> = {
  ALUNO: 'Aluno',
  PROFESSOR: 'Professor',
  ADMIN: 'Administrador',
};

export const roleOptions = Object.entries(roleLabels).map(([value, label]) => ({
  value: value as UserRole,
  label,
}));
