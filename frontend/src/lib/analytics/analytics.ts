import type { ConsentChoice } from '@/lib/analytics/consent-store';

/**
 * Eventos de produto (#49). Nenhum carrega nome, e-mail, matrícula, id de pessoa ou texto
 * digitado: só o que ajuda a entender o uso do sistema.
 */
export type AnalyticsEvent =
  | { name: 'login' }
  | { name: 'sign_up' }
  | {
      name: 'search';
      params: {
        tipo: string;
        bloco: boolean;
        caracteristicas: number;
        capacidade: boolean;
        data: boolean;
        horario: boolean;
        texto: boolean;
      };
    }
  | { name: 'reservation_created'; params: { tipo_recurso: string; duracao_min: number } }
  | { name: 'reservation_cancelled' }
  | { name: 'receipt_viewed'; params: { situacao: string } };

type GtagCommand = [string, ...unknown[]];

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

const CONSENT_DENIED = {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
} as const;

/**
 * Google Analytics 4 com Consent Mode v2 no modo básico: o `gtag.js` só é baixado depois do
 * aceite, então sem consentimento nada vai ao Google e nenhum cookie `_ga` é gravado. Sem
 * `VITE_GA_MEASUREMENT_ID` (desenvolvimento e testes) tudo aqui é inerte.
 */
export class Analytics {
  readonly #measurementId: string | null;
  #loaded = false;
  #granted = false;
  /** Rota aberta agora: quem aceita os cookies no meio da visita já conta a página atual. */
  #currentRoute: string | null = null;

  constructor(measurementId: string | null) {
    this.#measurementId = measurementId;
  }

  /** Há medição configurada; sem ela o aviso de cookies nem aparece. */
  get enabled(): boolean {
    return this.#measurementId !== null;
  }

  applyConsent(choice: ConsentChoice): void {
    if (!this.#measurementId) return;
    const wasGranted = this.#granted;
    this.#granted = choice === 'granted';
    if (this.#granted) {
      this.#load(this.#measurementId);
      this.#gtag('consent', 'update', { analytics_storage: 'granted' });
      if (!wasGranted && this.#currentRoute) this.#sendPageView(this.#currentRoute);
    } else if (this.#loaded) {
      this.#gtag('consent', 'update', { analytics_storage: 'denied' });
      deleteAnalyticsCookies();
    }
  }

  /** Página vista, pelo padrão da rota (`/recursos/:id`), nunca com ids ou query string. */
  pageView(route: string): void {
    this.#currentRoute = route;
    if (this.#granted) this.#sendPageView(route);
  }

  #sendPageView(route: string): void {
    this.#gtag('event', 'page_view', {
      page_location: `${window.location.origin}${route}`,
      page_path: route,
      page_title: route,
    });
  }

  track(event: AnalyticsEvent): void {
    if (!this.#granted) return;
    this.#gtag('event', event.name, 'params' in event ? event.params : {});
  }

  #load(measurementId: string): void {
    if (this.#loaded) return;
    this.#loaded = true;
    window.dataLayer = window.dataLayer ?? [];
    this.#gtag('consent', 'default', CONSENT_DENIED);
    this.#gtag('js', new Date());
    // A troca de página é enviada à mão, já com a rota sem ids.
    this.#gtag('config', measurementId, {
      send_page_view: false,
      // Sem cruzamento com contas Google nem uso em anúncios (Aviso de Privacidade).
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      // O cookie `_ga` dura 1 ano, e não os 2 anos padrão (necessidade, Art. 6º, III).
      cookie_expires: 60 * 60 * 24 * 365,
    });
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    document.head.append(script);
  }

  #gtag(...command: GtagCommand): void {
    // O gtag.js lê o objeto `arguments`, não um array: por isso a função tradicional.
    function gtag() {
      // oxlint-disable-next-line prefer-rest-params -- formato exigido pelo gtag.js
      window.dataLayer?.push(arguments);
    }
    Reflect.apply(gtag, undefined, command);
  }
}

/** Ao recusar depois de aceitar, apaga os cookies que o GA já tinha gravado. */
function deleteAnalyticsCookies(): void {
  const host = window.location.hostname;
  const domains = ['', host, `.${host.split('.').slice(-2).join('.')}`];
  for (const name of document.cookie.split(';').map((cookie) => cookie.split('=')[0]?.trim())) {
    if (!name || !name.startsWith('_ga')) continue;
    for (const domain of domains) {
      document.cookie = `${name}=; Max-Age=0; path=/${domain ? `; domain=${domain}` : ''}`;
    }
  }
}
