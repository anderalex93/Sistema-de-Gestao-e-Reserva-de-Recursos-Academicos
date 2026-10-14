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

/** Variável opcional: vazia vira `null` (recurso desligado). */
function optional(value: string | undefined): string | null {
  return value?.trim() || null;
}

export const config = {
  apiUrl: resolveApiUrl(),
  appName: 'EduSpace',
  /** Google Analytics 4 (#49). Sem ID, nada é carregado e o aviso de cookies não aparece. */
  gaMeasurementId: optional(import.meta.env.VITE_GA_MEASUREMENT_ID),
  /** Canal de suporte da página Ajuda (#47). Sem ele, a Ajuda orienta procurar a administração. */
  supportEmail: optional(import.meta.env.VITE_SUPPORT_EMAIL),
  /** Endereço público do site, para o canonical (#48). Também usado no build (sitemap, Open Graph). */
  siteUrl: optional(import.meta.env.VITE_SITE_URL)?.replace(/\/+$/, '') ?? null,
} as const;
