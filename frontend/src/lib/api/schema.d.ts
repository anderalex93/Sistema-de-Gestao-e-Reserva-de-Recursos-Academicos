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
  '/api/v1/auth/cadastro': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** Cria a própria conta (perfil Aluno) */
    post: operations['signup_api_v1_auth_cadastro_post'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/auth/login': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** Entra com e-mail e senha e recebe o token de acesso */
    post: operations['login_api_v1_auth_login_post'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/auth/me': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Dados de quem está logado */
    get: operations['me_api_v1_auth_me_get'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/admin/usuarios': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Lista e busca usuários */
    get: operations['list_users_api_v1_admin_usuarios_get'];
    put?: never;
    /** Cria a conta de um aluno, professor ou administrador */
    post: operations['create_user_api_v1_admin_usuarios_post'];
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
    /** HTTPValidationError */
    HTTPValidationError: {
      /** Detail */
      detail?: components['schemas']['ValidationError'][];
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
    /** LoginRequest */
    LoginRequest: {
      /**
       * Email
       * Format: email
       */
      email: string;
      /** Senha */
      senha: string;
    };
    /** Page[UserRead] */
    Page_UserRead_: {
      /** Items */
      items: components['schemas']['UserRead'][];
      /** Total */
      total: number;
      /** Page */
      page: number;
      /** Per Page */
      per_page: number;
      /** Total Pages */
      total_pages: number;
    };
    /** TokenRead */
    TokenRead: {
      /** Access Token */
      access_token: string;
      /**
       * Token Type
       * @default bearer
       * @constant
       */
      token_type: 'bearer';
      /**
       * Expires In
       * @description Validade do token em segundos
       */
      expires_in: number;
      usuario: components['schemas']['UserRead'];
    };
    /**
     * UserAdminCreate
     * @description Conta criada pelo administrador, que escolhe o perfil.
     */
    UserAdminCreate: {
      /** Nome */
      nome: string;
      /**
       * Email
       * Format: email
       */
      email: string;
      /** Senha */
      senha: string;
      /** Matricula */
      matricula?: string | null;
      /** @default ALUNO */
      perfil: components['schemas']['UserRole'];
    };
    /** UserRead */
    UserRead: {
      /** Id */
      id: number;
      /** Nome */
      nome: string;
      /** Email */
      email: string;
      perfil: components['schemas']['UserRole'];
      /** Matricula */
      matricula: string | null;
      /** Ativo */
      ativo: boolean;
      /**
       * Criado Em
       * Format: date-time
       */
      criado_em: string;
    };
    /**
     * UserRole
     * @enum {string}
     */
    UserRole: 'ALUNO' | 'PROFESSOR' | 'ADMIN';
    /**
     * UserSignup
     * @description Autocadastro: o perfil é sempre ALUNO.
     */
    UserSignup: {
      /** Nome */
      nome: string;
      /**
       * Email
       * Format: email
       */
      email: string;
      /** Senha */
      senha: string;
      /** Matricula */
      matricula?: string | null;
    };
    /** ValidationError */
    ValidationError: {
      /** Location */
      loc: (string | number)[];
      /** Message */
      msg: string;
      /** Error Type */
      type: string;
      /** Input */
      input?: unknown;
      /** Context */
      ctx?: Record<string, never>;
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
  signup_api_v1_auth_cadastro_post: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['UserSignup'];
      };
    };
    responses: {
      /** @description Successful Response */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['UserRead'];
        };
      };
      /** @description E-mail ou matrícula já cadastrados */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
      /** @description Validation Error */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['HTTPValidationError'];
        };
      };
      /** @description Muitas tentativas seguidas */
      429: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
    };
  };
  login_api_v1_auth_login_post: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['LoginRequest'];
      };
    };
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['TokenRead'];
        };
      };
      /** @description E-mail ou senha incorretos */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
      /** @description Conta desativada */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
      /** @description Validation Error */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['HTTPValidationError'];
        };
      };
      /** @description Muitas tentativas seguidas */
      429: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
    };
  };
  me_api_v1_auth_me_get: {
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
          'application/json': components['schemas']['UserRead'];
        };
      };
      /** @description Sem sessão válida */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
    };
  };
  list_users_api_v1_admin_usuarios_get: {
    parameters: {
      query?: {
        page?: number;
        per_page?: number;
        /** @description Trecho do nome, e-mail ou matrícula */
        busca?: string | null;
      };
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
          'application/json': components['schemas']['Page_UserRead_'];
        };
      };
      /** @description Sem sessão válida */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
      /** @description Apenas administradores */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
      /** @description Validation Error */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['HTTPValidationError'];
        };
      };
    };
  };
  create_user_api_v1_admin_usuarios_post: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['UserAdminCreate'];
      };
    };
    responses: {
      /** @description Successful Response */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['UserRead'];
        };
      };
      /** @description Sem sessão válida */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
      /** @description Apenas administradores */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
      /** @description E-mail ou matrícula já cadastrados */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
      /** @description Validation Error */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['HTTPValidationError'];
        };
      };
    };
  };
}
