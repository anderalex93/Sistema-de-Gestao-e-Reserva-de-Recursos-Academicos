import { createContext } from 'react';

import type { LoginRequest, UserRead } from '@/lib/api/types';

/** `error`: havia token, mas a API não respondeu ao restaurar a sessão. */
export type AuthStatus = 'loading' | 'authenticated' | 'anonymous' | 'error';

export interface AuthContextValue {
  status: AuthStatus;
  user: UserRead | null;
  login: (credentials: LoginRequest) => Promise<UserRead>;
  logout: () => void;
  retry: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
