// Gerado por `npm run gen:api` a partir do OpenAPI do backend. Não edite à mão.

export interface paths {
  '/api/v1/health': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Verifica se a API e o banco estão respondendo */
    get: operations['health_api_v1_health_get'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
}
export type webhooks = Record<string, never>;
export interface components {
  schemas: {
    /**
     * ErrorResponse
     * @description Formato de todo erro de domínio. Usado nos `responses` dos endpoints para o OpenAPI.
     */
    ErrorResponse: {
      /** Detail */
      detail: string;
      /** Code */
      code: string;
    };
    /** HealthRead */
    HealthRead: {
      /**
       * Status
       * @constant
       */
      status: 'ok';
      /**
       * Db
       * @constant
       */
      db: 'ok';
    };
  };
  responses: never;
  parameters: never;
  requestBodies: never;
  headers: never;
  pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
  health_api_v1_health_get: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['HealthRead'];
        };
      };
      /** @description Banco de dados indisponível */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
    };
  };
}
