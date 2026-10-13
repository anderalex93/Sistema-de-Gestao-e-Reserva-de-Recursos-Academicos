import type { HttpClient } from '@/lib/api/http-client';
import type { LoginRequest, MyDataExport, TokenRead, UserRead, UserSignup } from '@/lib/api/types';

export class AuthApi {
  readonly #http: HttpClient;

  constructor(http: HttpClient) {
    this.#http = http;
  }

  signup(data: UserSignup): Promise<UserRead> {
    return this.#http.post<UserRead>('/auth/cadastro', data);
  }

  login(data: LoginRequest): Promise<TokenRead> {
    return this.#http.post<TokenRead>('/auth/login', data);
  }

  me(): Promise<UserRead> {
    return this.#http.get<UserRead>('/auth/me');
  }

  /** Aceite dos termos no primeiro acesso de conta criada pelo admin. */
  acceptTerms(): Promise<UserRead> {
    return this.#http.post<UserRead>('/auth/me/aceite-termos');
  }

  /** Tudo o que o sistema guarda sobre a pessoa (LGPD, Art. 18). */
  exportData(): Promise<MyDataExport> {
    return this.#http.get<MyDataExport>('/auth/me/dados');
  }

  /** Anonimiza e desativa a própria conta. Pede a senha atual. */
  deleteAccount(senha: string): Promise<void> {
    return this.#http.post<void>('/auth/me/exclusao', { senha });
  }
}
