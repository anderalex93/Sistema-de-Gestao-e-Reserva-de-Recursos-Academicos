export const paths = {
  home: '/',
  login: '/login',
  signup: '/cadastro',
  reserve: '/reservar',
  resource: (id: number | string) => `/recursos/${id}`,
  myReservations: '/minhas-reservas',
  receipt: (code: string) => `/comprovantes/${code}`,
  account: '/conta',
  admin: '/admin',
} as const;
