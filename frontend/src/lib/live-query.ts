/**
 * "Tempo real" do MVP (#31): consultas que mudam com reservas de outras pessoas são refeitas a
 * cada 10 s enquanto a aba está visível, e na hora em que a pessoa volta para a aba. Com a aba
 * oculta, nada é pedido. O 409 da exclusion constraint continua sendo a garantia final.
 */
export const LIVE_REFRESH_MS = 10_000;

export const liveQueryOptions = {
  refetchInterval: LIVE_REFRESH_MS,
  refetchIntervalInBackground: false,
  refetchOnWindowFocus: true,
} as const;
