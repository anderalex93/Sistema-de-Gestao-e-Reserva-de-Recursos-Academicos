import type { HttpClient } from '@/lib/api/http-client';
import type { LoginRequest, TokenRead, UserRead, UserSignup } from '@/lib/api/types';

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
}
