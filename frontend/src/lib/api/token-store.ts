export interface TokenStore {
  get(): string | null;
  set(token: string): void;
  clear(): void;
}

/** Guarda o token no localStorage (decisão do ADR 0001). Tolera storage bloqueado. */
export class LocalStorageTokenStore implements TokenStore {
  readonly #key: string;

  constructor(key = 'eduspace.token') {
    this.#key = key;
  }

  get(): string | null {
    try {
      return window.localStorage.getItem(this.#key);
    } catch {
      return null;
    }
  }

  set(token: string): void {
    try {
      window.localStorage.setItem(this.#key, token);
    } catch {
      // Storage indisponível (aba anônima restrita): a sessão dura só enquanto a página estiver aberta.
    }
  }

  clear(): void {
    try {
      window.localStorage.removeItem(this.#key);
    } catch {
      // Nada a limpar se o storage está indisponível.
    }
  }
}

export class MemoryTokenStore implements TokenStore {
  #token: string | null = null;

  get(): string | null {
    return this.#token;
  }

  set(token: string): void {
    this.#token = token;
  }

  clear(): void {
    this.#token = null;
  }
}
