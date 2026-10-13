const DEV_API_URL = 'http://localhost:8000/api/v1';

function resolveApiUrl(): string {
  const fromEnv = import.meta.env.VITE_API_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/+$/, '');
  }
  if (import.meta.env.PROD) {
    throw new Error('VITE_API_URL não foi definida para o build de produção.');
  }
  return DEV_API_URL;
}

export const config = {
  apiUrl: resolveApiUrl(),
  appName: 'EduSpace',
} as const;
