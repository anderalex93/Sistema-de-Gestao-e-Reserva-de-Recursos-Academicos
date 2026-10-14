export type ConsentChoice = 'granted' | 'denied';

/**
 * Versão do texto de cookies do Aviso de Privacidade. Quando o texto muda, a versão muda e a
 * pessoa é perguntada de novo: o consentimento vale para o que ela leu (LGPD, Art. 8º).
 */
export const CONSENT_VERSION = '2026-10-13';

interface StoredConsent {
  escolha: ConsentChoice;
  /** Quando a pessoa escolheu (ISO 8601): registro do consentimento no próprio navegador. */
  em: string;
  versao: string;
}

function parse(raw: string | null): StoredConsent | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<StoredConsent>;
    const valid =
      (value.escolha === 'granted' || value.escolha === 'denied') &&
      typeof value.em === 'string' &&
      value.versao === CONSENT_VERSION;
    return valid ? (value as StoredConsent) : null;
  } catch {
    return null;
  }
}

/**
 * Escolha do aviso de cookies, guardada no navegador com data e versão do aviso. Não é dado
 * pessoal. Tolera storage bloqueado (a escolha vale enquanto a página estiver aberta).
 */
export class ConsentStore {
  readonly #key: string;
  readonly #now: () => Date;
  #memory: StoredConsent | null = null;

  constructor(key = 'eduspace.cookies', now: () => Date = () => new Date()) {
    this.#key = key;
    this.#now = now;
  }

  get(): ConsentChoice | null {
    try {
      return (parse(window.localStorage.getItem(this.#key)) ?? this.#memory)?.escolha ?? null;
    } catch {
      return this.#memory?.escolha ?? null;
    }
  }

  set(choice: ConsentChoice): void {
    this.#memory = { escolha: choice, em: this.#now().toISOString(), versao: CONSENT_VERSION };
    try {
      window.localStorage.setItem(this.#key, JSON.stringify(this.#memory));
    } catch {
      // Storage indisponível: fica só em memória.
    }
  }
}
