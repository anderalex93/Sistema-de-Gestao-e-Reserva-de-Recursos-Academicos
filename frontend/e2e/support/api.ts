import { randomUUID } from 'node:crypto';

import { expect, type APIRequestContext } from '@playwright/test';

import type { Page, ReservationRead, ResourceRead, TokenRead } from '../../src/lib/api/types';
import { API_URL } from './env';
import { campusInstant } from './schedule';

export interface TestUser {
  nome: string;
  email: string;
  senha: string;
}

/** Pessoa sintética, com e-mail único no domínio institucional aceito pelo cadastro. */
export function newUser(): TestUser {
  const id = randomUUID().slice(0, 8);
  return { nome: `Pessoa E2E ${id}`, email: `e2e.${id}@umj.edu.br`, senha: 'Senha123e2e' };
}

/** Atalhos pela API para preparar o cenário sem repetir telas que outro teste já cobre. */
export class ApiHelper {
  readonly #request: APIRequestContext;

  constructor(request: APIRequestContext) {
    this.#request = request;
  }

  async signup(user: TestUser = newUser()): Promise<TestUser> {
    const response = await this.#request.post(`${API_URL}/auth/cadastro`, {
      data: { ...user, aceite_termos: true },
    });
    expect(response.status(), await response.text()).toBe(201);
    return user;
  }

  async token(user: TestUser): Promise<string> {
    const response = await this.#request.post(`${API_URL}/auth/login`, {
      data: { email: user.email, senha: user.senha },
    });
    expect(response.ok(), await response.text()).toBe(true);
    return ((await response.json()) as TokenRead).access_token;
  }

  /** Contas criadas pelo seed ainda não aceitaram os termos (LGPD, #34). */
  async acceptTerms(user: TestUser): Promise<void> {
    const response = await this.#request.post(`${API_URL}/auth/me/aceite-termos`, {
      headers: { Authorization: `Bearer ${await this.token(user)}` },
    });
    expect(response.ok(), await response.text()).toBe(true);
  }

  async resourceByName(user: TestUser, nome: string, bloco: string): Promise<ResourceRead> {
    const response = await this.#request.get(`${API_URL}/recursos`, {
      headers: { Authorization: `Bearer ${await this.token(user)}` },
      params: { busca: nome, per_page: 50 },
    });
    expect(response.ok(), await response.text()).toBe(true);
    const page = (await response.json()) as Page<ResourceRead>;
    const resource = page.items.find((item) => item.nome === nome && item.bloco.nome === bloco);
    if (!resource) throw new Error(`Recurso ${nome} (${bloco}) não está no seed.`);
    return resource;
  }

  async reserve(
    user: TestUser,
    resource: ResourceRead,
    date: string,
    inicio: string,
    fim: string,
  ): Promise<ReservationRead> {
    const response = await this.#request.post(`${API_URL}/reservas`, {
      headers: { Authorization: `Bearer ${await this.token(user)}` },
      data: {
        recurso_id: resource.id,
        inicio: campusInstant(date, inicio),
        fim: campusInstant(date, fim),
      },
    });
    expect(response.status(), await response.text()).toBe(201);
    return (await response.json()) as ReservationRead;
  }

  /** Primeira meia hora livre do dia, entre as horas dadas (cenários que só precisam de uma reserva). */
  async reserveFirstFree(
    user: TestUser,
    resource: ResourceRead,
    date: string,
    hours: readonly number[],
  ): Promise<ReservationRead> {
    const token = await this.token(user);
    for (const hour of hours) {
      const start = `${String(hour).padStart(2, '0')}:00`;
      const response = await this.#request.post(`${API_URL}/reservas`, {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          recurso_id: resource.id,
          inicio: campusInstant(date, start),
          fim: campusInstant(date, `${String(hour).padStart(2, '0')}:30`),
        },
      });
      if (response.status() === 201) return (await response.json()) as ReservationRead;
      expect(response.status(), await response.text()).toBe(409);
    }
    throw new Error(`Nenhum horário livre em ${resource.nome} no dia ${date}.`);
  }
}
