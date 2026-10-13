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
  '/api/v1/config/regras': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Horário de funcionamento e regras de reserva (público) */
    get: operations['get_rules_api_v1_config_regras_get'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/blocos': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Lista os blocos do campus */
    get: operations['list_buildings_api_v1_blocos_get'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/caracteristicas': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Lista as características usadas nos filtros */
    get: operations['list_features_api_v1_caracteristicas_get'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/recursos': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Busca recursos para reservar, com filtros e horário livre */
    get: operations['search_resources_api_v1_recursos_get'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/recursos/{resource_id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Detalhe de um recurso */
    get: operations['get_resource_api_v1_recursos__resource_id__get'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/recursos/{resource_id}/disponibilidade': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Grade de horários de 30 minutos de um recurso num dia
     * @description Dia no fuso do campus (America/Maceio). Dia em que o campus não abre volta sem horários. Quem reservou só é identificado para administradores.
     */
    get: operations['get_availability_api_v1_recursos__resource_id__disponibilidade_get'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/reservas': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** Reserva um recurso num intervalo livre */
    post: operations['create_reservation_api_v1_reservas_post'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/reservas/{reservation_id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Detalhe de uma reserva (dono ou administrador) */
    get: operations['get_reservation_api_v1_reservas__reservation_id__get'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/quadro': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Ocupação de todos os recursos num dia
     * @description Para cada recurso ativo, os intervalos já reservados no dia (fuso do campus). Quem reservou só é identificado para administradores.
     */
    get: operations['get_board_api_v1_quadro_get'];
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
    /** AvailabilityRead */
    AvailabilityRead: {
      /** Recurso Id */
      recurso_id: number;
      /**
       * Data
       * Format: date
       */
      data: string;
      /** Slots */
      slots: components['schemas']['SlotRead'][];
    };
    /** BoardRead */
    BoardRead: {
      /**
       * Data
       * Format: date
       */
      data: string;
      /**
       * Abertura
       * @description Nulo quando o campus não abre no dia
       */
      abertura: string | null;
      /** Fechamento */
      fechamento: string | null;
      /** Linhas */
      linhas: components['schemas']['BoardRowRead'][];
    };
    /** BoardResourceRead */
    BoardResourceRead: {
      /** Id */
      id: number;
      /** Nome */
      nome: string;
      tipo: components['schemas']['ResourceType'];
      /** Capacidade */
      capacidade: number | null;
      bloco: components['schemas']['BuildingRead'];
    };
    /** BoardRowRead */
    BoardRowRead: {
      recurso: components['schemas']['BoardResourceRead'];
      /** Ocupacoes */
      ocupacoes: components['schemas']['OccupationRead'][];
    };
    /** BuildingRead */
    BuildingRead: {
      /** Id */
      id: number;
      /** Nome */
      nome: string;
      /** Descricao */
      descricao: string | null;
    };
    /** DayHoursRead */
    DayHoursRead: {
      /**
       * Dia Semana
       * @description ISO 8601: 1 = segunda, 7 = domingo
       */
      dia_semana: number;
      /**
       * Abertura
       * Format: time
       */
      abertura: string;
      /**
       * Fechamento
       * Format: time
       */
      fechamento: string;
    };
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
    /** FeatureRead */
    FeatureRead: {
      /** Id */
      id: number;
      /** Nome */
      nome: string;
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
    /** OccupationRead */
    OccupationRead: {
      /**
       * Inicio
       * Format: date-time
       */
      inicio: string;
      /**
       * Fim
       * Format: date-time
       */
      fim: string;
      /**
       * Propria
       * @description Reservada por quem consulta
       */
      propria: boolean;
      /**
       * Reservado Por
       * @description Só para administradores (LGPD)
       */
      reservado_por: string | null;
    };
    /** Page[ResourceRead] */
    Page_ResourceRead_: {
      /** Items */
      items: components['schemas']['ResourceRead'][];
      /** Total */
      total: number;
      /** Page */
      page: number;
      /** Per Page */
      per_page: number;
      /** Total Pages */
      total_pages: number;
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
    /** ReservationCreate */
    ReservationCreate: {
      /** Recurso Id */
      recurso_id: number;
      /**
       * Inicio
       * Format: date-time
       */
      inicio: string;
      /**
       * Fim
       * Format: date-time
       */
      fim: string;
      /** Finalidade */
      finalidade?: string | null;
      /** Qtd Participantes */
      qtd_participantes?: number | null;
    };
    /** ReservationRead */
    ReservationRead: {
      /** Id */
      id: number;
      /** Codigo */
      codigo: string;
      status: components['schemas']['ReservationStatus'];
      /**
       * Inicio
       * Format: date-time
       */
      inicio: string;
      /**
       * Fim
       * Format: date-time
       */
      fim: string;
      /** Finalidade */
      finalidade: string | null;
      /** Qtd Participantes */
      qtd_participantes: number | null;
      recurso: components['schemas']['ResourceRead'];
      /** Usuario Id */
      usuario_id: number;
      /**
       * Criado Em
       * Format: date-time
       */
      criado_em: string;
      /** Cancelada Em */
      cancelada_em: string | null;
    };
    /**
     * ReservationStatus
     * @enum {string}
     */
    ReservationStatus: 'CONFIRMADA' | 'CANCELADA';
    /** ResourceRead */
    ResourceRead: {
      /** Id */
      id: number;
      /** Nome */
      nome: string;
      tipo: components['schemas']['ResourceType'];
      /** Capacidade */
      capacidade: number | null;
      /** Andar */
      andar: string | null;
      /** Descricao */
      descricao: string | null;
      bloco: components['schemas']['BuildingRead'];
      /** Caracteristicas */
      caracteristicas: components['schemas']['FeatureRead'][];
    };
    /**
     * ResourceType
     * @enum {string}
     */
    ResourceType: 'SALA_ESTUDO' | 'LABORATORIO' | 'AUDITORIO' | 'EQUIPAMENTO';
    /**
     * RulesRead
     * @description Regras que o front precisa conhecer antes de chamar a API.
     */
    RulesRead: {
      /** Fuso */
      fuso: string;
      /** Intervalo Minutos */
      intervalo_minutos: number;
      /**
       * Horarios
       * @description Dias ausentes: campus fechado
       */
      horarios: components['schemas']['DayHoursRead'][];
    };
    /** SlotRead */
    SlotRead: {
      /**
       * Inicio
       * Format: date-time
       */
      inicio: string;
      /**
       * Fim
       * Format: date-time
       */
      fim: string;
      status: components['schemas']['SlotStatus'];
      /**
       * Propria
       * @description O horário está reservado por quem consulta
       */
      propria: boolean;
      /**
       * Reservado Por
       * @description Nome de quem reservou. Só aparece para administradores (LGPD)
       */
      reservado_por: string | null;
    };
    /**
     * SlotStatus
     * @description Situação de um intervalo de 30 minutos na grade de disponibilidade.
     * @enum {string}
     */
    SlotStatus: 'LIVRE' | 'OCUPADO' | 'PASSADO';
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
  get_rules_api_v1_config_regras_get: {
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
          'application/json': components['schemas']['RulesRead'];
        };
      };
    };
  };
  list_buildings_api_v1_blocos_get: {
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
          'application/json': components['schemas']['BuildingRead'][];
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
  list_features_api_v1_caracteristicas_get: {
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
          'application/json': components['schemas']['FeatureRead'][];
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
  search_resources_api_v1_recursos_get: {
    parameters: {
      query?: {
        page?: number;
        per_page?: number;
        bloco_id?: number | null;
        tipo?: components['schemas']['ResourceType'] | null;
        /** @description IDs de características; o recurso precisa ter todas */
        caracteristicas?: number[];
        capacidade_min?: number | null;
        /** @description Trecho do nome */
        busca?: string | null;
        /** @description Com `fim`: só recursos livres no intervalo */
        inicio?: string | null;
        fim?: string | null;
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
          'application/json': components['schemas']['Page_ResourceRead_'];
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
      /** @description Intervalo inválido ou no passado */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
    };
  };
  get_resource_api_v1_recursos__resource_id__get: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        resource_id: number;
      };
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
          'application/json': components['schemas']['ResourceRead'];
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
      /** @description Recurso inexistente ou inativo */
      404: {
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
  get_availability_api_v1_recursos__resource_id__disponibilidade_get: {
    parameters: {
      query: {
        /** @description Dia, AAAA-MM-DD */
        data: string;
      };
      header?: never;
      path: {
        resource_id: number;
      };
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
          'application/json': components['schemas']['AvailabilityRead'];
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
      /** @description Recurso inexistente ou inativo */
      404: {
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
  create_reservation_api_v1_reservas_post: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['ReservationCreate'];
      };
    };
    responses: {
      /** @description Successful Response */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ReservationRead'];
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
      /** @description Recurso inexistente ou inativo */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
      /** @description Horário ocupado (RESERVA_CONFLITO) */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
      /** @description Horário ou participantes fora das regras */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
    };
  };
  get_reservation_api_v1_reservas__reservation_id__get: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        reservation_id: number;
      };
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
          'application/json': components['schemas']['ReservationRead'];
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
      /** @description Reserva inexistente ou de outra pessoa */
      404: {
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
  get_board_api_v1_quadro_get: {
    parameters: {
      query: {
        /** @description Dia, AAAA-MM-DD, no fuso do campus */
        data: string;
        bloco_id?: number | null;
        tipo?: components['schemas']['ResourceType'] | null;
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
          'application/json': components['schemas']['BoardRead'];
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
