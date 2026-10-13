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
  '/api/v1/auth/me/aceite-termos': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Registra o aceite do Aviso de Privacidade e dos Termos de Uso
     * @description Para contas criadas pelo administrador, no primeiro acesso.
     */
    post: operations['accept_terms_api_v1_auth_me_aceite_termos_post'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/auth/me/dados': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Exporta todos os meus dados em JSON (LGPD, Art. 18) */
    get: operations['export_my_data_api_v1_auth_me_dados_get'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/auth/me/exclusao': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Exclui a minha conta (LGPD, Art. 18, VI)
     * @description Pede a senha atual. A conta é anonimizada e desativada: nome, e-mail e matrícula somem, as reservas antigas ficam no histórico do espaço sem identificar ninguém e as futuras são canceladas. Administradores não podem se excluir por aqui.
     */
    post: operations['delete_my_account_api_v1_auth_me_exclusao_post'];
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
  '/api/v1/reservas/minhas': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Minhas reservas: próximas ou histórico */
    get: operations['list_my_reservations_api_v1_reservas_minhas_get'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/reservas/comprovante/{codigo}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Verificação pública de um comprovante (sem login) */
    get: operations['get_receipt_api_v1_reservas_comprovante__codigo__get'];
    put?: never;
    post?: never;
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
  '/api/v1/reservas/{reservation_id}/cancelar': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** Cancela uma reserva (até 30 minutos antes do início) */
    post: operations['cancel_reservation_api_v1_reservas__reservation_id__cancelar_post'];
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
  '/api/v1/admin/usuarios/{user_id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    /**
     * Altera o perfil ou ativa e desativa uma conta
     * @description O novo perfil vale a partir do próximo acesso. Conta desativada perde a sessão na hora e as reservas dela que ainda não começaram são canceladas; o histórico continua. O admin não pode tirar o próprio acesso de administrador nem se desativar.
     */
    patch: operations['update_user_api_v1_admin_usuarios__user_id__patch'];
    trace?: never;
  };
  '/api/v1/admin/blocos': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Lista todos os blocos, ativos e desativados */
    get: operations['list_buildings_api_v1_admin_blocos_get'];
    put?: never;
    /** Cria um bloco */
    post: operations['create_building_api_v1_admin_blocos_post'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/admin/blocos/{building_id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    /** Altera nome e descrição de um bloco */
    put: operations['update_building_api_v1_admin_blocos__building_id__put'];
    post?: never;
    /**
     * Exclui um bloco vazio ou desativa um bloco com recursos
     * @description Bloco sem recursos é apagado. Com recursos, é desativado: todos somem da busca e o histórico continua. Se houver reservas que ainda não começaram, responde `409 RESERVAS_FUTURAS` com a quantidade; repita com `forcar=true` para cancelá-las.
     */
    delete: operations['remove_building_api_v1_admin_blocos__building_id__delete'];
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/admin/blocos/{building_id}/reativar': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** Reativa um bloco desativado */
    post: operations['reactivate_building_api_v1_admin_blocos__building_id__reativar_post'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/admin/recursos': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Lista recursos ativos e desativados, com busca e filtros */
    get: operations['list_resources_api_v1_admin_recursos_get'];
    put?: never;
    /** Cria um recurso, que aparece na busca na hora */
    post: operations['create_resource_api_v1_admin_recursos_post'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/admin/recursos/{resource_id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Detalhe de um recurso, mesmo desativado */
    get: operations['get_resource_api_v1_admin_recursos__resource_id__get'];
    /** Altera todos os dados de um recurso */
    put: operations['update_resource_api_v1_admin_recursos__resource_id__put'];
    post?: never;
    /**
     * Exclui um recurso sem histórico ou desativa um recurso já reservado
     * @description Sem nenhuma reserva, o recurso é apagado. Com reservas, é desativado: some da busca e o histórico continua. Se houver reservas que ainda não começaram, responde `409 RESERVAS_FUTURAS` com a quantidade; repita com `forcar=true` para cancelá-las.
     */
    delete: operations['remove_resource_api_v1_admin_recursos__resource_id__delete'];
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/admin/recursos/{resource_id}/reativar': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** Reativa um recurso desativado */
    post: operations['reactivate_resource_api_v1_admin_recursos__resource_id__reativar_post'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/admin/caracteristicas': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Lista as características com quantos recursos usam cada uma */
    get: operations['list_features_api_v1_admin_caracteristicas_get'];
    put?: never;
    /** Cria uma característica */
    post: operations['create_feature_api_v1_admin_caracteristicas_post'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/admin/caracteristicas/{feature_id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    /** Renomeia uma característica */
    put: operations['update_feature_api_v1_admin_caracteristicas__feature_id__put'];
    post?: never;
    /** Exclui uma característica e a retira dos recursos que a usam */
    delete: operations['remove_feature_api_v1_admin_caracteristicas__feature_id__delete'];
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/admin/reservas': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Agenda do dia: todas as reservas, com quem reservou
     * @description Reservas que tocam o dia no fuso do campus, de qualquer status, ordenadas por bloco, recurso e horário. Sem `data`, usa o dia de hoje.
     */
    get: operations['list_agenda_api_v1_admin_reservas_get'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/admin/reservas/{reservation_id}/cancelar': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Cancela qualquer reserva que ainda não terminou, com motivo
     * @description Sem o prazo de 30 minutos. O motivo aparece no histórico de quem reservou.
     */
    post: operations['cancel_reservation_api_v1_admin_reservas__reservation_id__cancelar_post'];
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
    /** AccountDeletion */
    AccountDeletion: {
      /**
       * Senha
       * @description Senha atual, para confirmar
       */
      senha: string;
    };
    /** AdminCancellation */
    AdminCancellation: {
      /**
       * Motivo
       * @description Aparece para o dono da reserva no histórico
       */
      motivo: string;
    };
    /** AdminReservationRead */
    AdminReservationRead: {
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
      /**
       * Motivo Cancelamento
       * @description Preenchido quando a administração cancela a reserva
       */
      motivo_cancelamento: string | null;
      usuario: components['schemas']['ReservationHolderRead'];
    };
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
    /** BuildingAdminRead */
    BuildingAdminRead: {
      /** Id */
      id: number;
      /** Nome */
      nome: string;
      /** Descricao */
      descricao: string | null;
      /** Ativo */
      ativo: boolean;
      /**
       * Total Recursos
       * @description Recursos cadastrados no bloco, ativos ou não
       */
      total_recursos: number;
    };
    /** BuildingCreate */
    BuildingCreate: {
      /** Nome */
      nome: string;
      /** Descricao */
      descricao?: string | null;
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
    /** BuildingStatusRead */
    BuildingStatusRead: {
      /** Id */
      id: number;
      /** Nome */
      nome: string;
      /** Descricao */
      descricao: string | null;
      /** Ativo */
      ativo: boolean;
    };
    /**
     * BuildingUpdate
     * @description PUT substitui todos os campos editáveis. Ativar e desativar têm endpoints próprios.
     */
    BuildingUpdate: {
      /** Nome */
      nome: string;
      /** Descricao */
      descricao?: string | null;
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
    /** FeatureAdminRead */
    FeatureAdminRead: {
      /** Id */
      id: number;
      /** Nome */
      nome: string;
      /**
       * Total Recursos
       * @description Recursos que têm esta característica
       */
      total_recursos: number;
    };
    /** FeatureCreate */
    FeatureCreate: {
      /** Nome */
      nome: string;
    };
    /** FeatureRead */
    FeatureRead: {
      /** Id */
      id: number;
      /** Nome */
      nome: string;
    };
    /** FeatureUpdate */
    FeatureUpdate: {
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
    /**
     * MyDataExport
     * @description Tudo o que o EduSpace guarda sobre a pessoa, num arquivo só (Art. 18, II e V).
     */
    MyDataExport: {
      /**
       * Gerado Em
       * Format: date-time
       */
      gerado_em: string;
      conta: components['schemas']['UserRead'];
      /** Reservas */
      reservas: components['schemas']['ReservationExportRead'][];
    };
    /** MyReservationRead */
    MyReservationRead: {
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
      /**
       * Motivo Cancelamento
       * @description Preenchido quando a administração cancela a reserva
       */
      motivo_cancelamento: string | null;
      /**
       * Pode Cancelar
       * @description Confirmada e com pelo menos 30 minutos até o início (RF04)
       */
      pode_cancelar: boolean;
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
    /** Page[AdminReservationRead] */
    Page_AdminReservationRead_: {
      /** Items */
      items: components['schemas']['AdminReservationRead'][];
      /** Total */
      total: number;
      /** Page */
      page: number;
      /** Per Page */
      per_page: number;
      /** Total Pages */
      total_pages: number;
    };
    /** Page[MyReservationRead] */
    Page_MyReservationRead_: {
      /** Items */
      items: components['schemas']['MyReservationRead'][];
      /** Total */
      total: number;
      /** Page */
      page: number;
      /** Per Page */
      per_page: number;
      /** Total Pages */
      total_pages: number;
    };
    /** Page[ResourceAdminRead] */
    Page_ResourceAdminRead_: {
      /** Items */
      items: components['schemas']['ResourceAdminRead'][];
      /** Total */
      total: number;
      /** Page */
      page: number;
      /** Per Page */
      per_page: number;
      /** Total Pages */
      total_pages: number;
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
    /** ReceiptBuildingRead */
    ReceiptBuildingRead: {
      /** Nome */
      nome: string;
    };
    /**
     * ReceiptRead
     * @description Comprovante público: só o necessário para conferir na entrada (LGPD, minimização).
     */
    ReceiptRead: {
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
      recurso: components['schemas']['ReceiptResourceRead'];
      /**
       * Responsavel
       * @description Só o primeiro nome de quem reservou
       */
      responsavel: string;
      /** Cancelada Em */
      cancelada_em: string | null;
    };
    /** ReceiptResourceRead */
    ReceiptResourceRead: {
      /** Nome */
      nome: string;
      tipo: components['schemas']['ResourceType'];
      /** Andar */
      andar: string | null;
      bloco: components['schemas']['ReceiptBuildingRead'];
    };
    /**
     * RemovalOutcome
     * @description O que aconteceu ao excluir um bloco ou recurso pela administração.
     * @enum {string}
     */
    RemovalOutcome: 'EXCLUIDO' | 'DESATIVADO';
    /**
     * RemovalRead
     * @description Resultado de `DELETE`: exclusão física só acontece quando não há histórico.
     */
    RemovalRead: {
      resultado: components['schemas']['RemovalOutcome'];
      /**
       * Reservas Canceladas
       * @description Reservas futuras canceladas com `forcar=true`
       */
      reservas_canceladas: number;
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
    /** ReservationExportRead */
    ReservationExportRead: {
      /** Codigo */
      codigo: string;
      status: components['schemas']['ReservationStatus'];
      /** Recurso */
      recurso: string;
      /** Bloco */
      bloco: string;
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
      /**
       * Criado Em
       * Format: date-time
       */
      criado_em: string;
      /** Cancelada Em */
      cancelada_em: string | null;
      /** Motivo Cancelamento */
      motivo_cancelamento: string | null;
    };
    /**
     * ReservationHolderRead
     * @description Quem reservou, para a administração poder avisar a pessoa.
     */
    ReservationHolderRead: {
      /** Id */
      id: number;
      /** Nome */
      nome: string;
      /** Email */
      email: string;
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
      /**
       * Motivo Cancelamento
       * @description Preenchido quando a administração cancela a reserva
       */
      motivo_cancelamento: string | null;
    };
    /**
     * ReservationScope
     * @description Abas de Minhas Reservas.
     * @enum {string}
     */
    ReservationScope: 'proximas' | 'historico';
    /**
     * ReservationStatus
     * @enum {string}
     */
    ReservationStatus: 'CONFIRMADA' | 'CANCELADA';
    /** ResourceAdminRead */
    ResourceAdminRead: {
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
      bloco: components['schemas']['BuildingStatusRead'];
      /** Caracteristicas */
      caracteristicas: components['schemas']['FeatureRead'][];
      /** Ativo */
      ativo: boolean;
    };
    /** ResourceCreate */
    ResourceCreate: {
      /** Bloco Id */
      bloco_id: number;
      tipo: components['schemas']['ResourceType'];
      /** Nome */
      nome: string;
      /** Capacidade */
      capacidade?: number | null;
      /** Andar */
      andar?: string | null;
      /** Descricao */
      descricao?: string | null;
      /** Caracteristica Ids */
      caracteristica_ids?: number[];
    };
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
     * ResourceUpdate
     * @description PUT substitui todos os campos editáveis, inclusive a lista de características.
     */
    ResourceUpdate: {
      /** Bloco Id */
      bloco_id: number;
      tipo: components['schemas']['ResourceType'];
      /** Nome */
      nome: string;
      /** Capacidade */
      capacidade?: number | null;
      /** Andar */
      andar?: string | null;
      /** Descricao */
      descricao?: string | null;
      /** Caracteristica Ids */
      caracteristica_ids?: number[];
    };
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
      /** Duracao Max Minutos */
      duracao_max_minutos: number;
      /** Antecedencia Max Dias */
      antecedencia_max_dias: number;
      /**
       * Limite Reservas Ativas
       * @description Reservas confirmadas e não terminadas por perfil; nulo = sem limite
       */
      limite_reservas_ativas: {
        [key: string]: number | null;
      };
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
     * @description Conta criada pelo administrador, que escolhe o perfil. A pessoa aceita os termos no
     *     primeiro acesso: o admin não pode consentir por ela.
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
    /**
     * UserAdminUpdate
     * @description Mudança parcial feita pelo admin: perfil, situação ou os dois.
     */
    UserAdminUpdate: {
      perfil?: components['schemas']['UserRole'] | null;
      /** Ativo */
      ativo?: boolean | null;
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
      /**
       * Aceite Termos Em
       * @description Quando a pessoa aceitou os termos; vazio obriga o aceite no próximo acesso
       */
      aceite_termos_em: string | null;
    };
    /**
     * UserRole
     * @enum {string}
     */
    UserRole: 'ALUNO' | 'PROFESSOR' | 'ADMIN';
    /**
     * UserSignup
     * @description Autocadastro: o perfil é sempre ALUNO e o aceite é obrigatório (LGPD, Art. 8º e 9º).
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
      /**
       * Aceite Termos
       * @description Li e concordo com o Aviso de Privacidade e os Termos de Uso
       */
      aceite_termos: boolean;
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
  accept_terms_api_v1_auth_me_aceite_termos_post: {
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
  export_my_data_api_v1_auth_me_dados_get: {
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
          'application/json': components['schemas']['MyDataExport'];
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
  delete_my_account_api_v1_auth_me_exclusao_post: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['AccountDeletion'];
      };
    };
    responses: {
      /** @description Successful Response */
      204: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
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
      /** @description Senha incorreta ou conta de administrador */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
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
  list_my_reservations_api_v1_reservas_minhas_get: {
    parameters: {
      query?: {
        page?: number;
        per_page?: number;
        escopo?: components['schemas']['ReservationScope'];
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
          'application/json': components['schemas']['Page_MyReservationRead_'];
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
  get_receipt_api_v1_reservas_comprovante__codigo__get: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        codigo: string;
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
          'application/json': components['schemas']['ReceiptRead'];
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
      /** @description Código inexistente */
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
      /** @description Muitas consultas seguidas */
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
  cancel_reservation_api_v1_reservas__reservation_id__cancelar_post: {
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
          'application/json': components['schemas']['MyReservationRead'];
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
      /** @description A reserva é de outra pessoa */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
      /** @description Reserva inexistente */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
      /** @description Reserva já cancelada */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
      /** @description Fora do prazo de cancelamento */
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
  update_user_api_v1_admin_usuarios__user_id__patch: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        user_id: number;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['UserAdminUpdate'];
      };
    };
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
      /** @description Apenas administradores */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
      /** @description Usuário inexistente */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
      /** @description Admin tentando se rebaixar ou se desativar */
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
  list_buildings_api_v1_admin_blocos_get: {
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
          'application/json': components['schemas']['BuildingAdminRead'][];
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
    };
  };
  create_building_api_v1_admin_blocos_post: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['BuildingCreate'];
      };
    };
    responses: {
      /** @description Successful Response */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['BuildingAdminRead'];
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
      /** @description Já existe um bloco com este nome */
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
  update_building_api_v1_admin_blocos__building_id__put: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        building_id: number;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['BuildingUpdate'];
      };
    };
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['BuildingAdminRead'];
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
      /** @description Bloco inexistente */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
      /** @description Já existe um bloco com este nome */
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
  remove_building_api_v1_admin_blocos__building_id__delete: {
    parameters: {
      query?: {
        /** @description Cancela as reservas futuras */
        forcar?: boolean;
      };
      header?: never;
      path: {
        building_id: number;
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
          'application/json': components['schemas']['RemovalRead'];
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
      /** @description Bloco inexistente */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
      /** @description Há reservas futuras e `forcar` é falso */
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
  reactivate_building_api_v1_admin_blocos__building_id__reativar_post: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        building_id: number;
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
          'application/json': components['schemas']['BuildingAdminRead'];
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
      /** @description Bloco inexistente */
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
  list_resources_api_v1_admin_recursos_get: {
    parameters: {
      query?: {
        page?: number;
        per_page?: number;
        /** @description Trecho do nome */
        busca?: string | null;
        bloco_id?: number | null;
        tipo?: components['schemas']['ResourceType'] | null;
        /** @description Sem o filtro, lista ativos e inativos */
        ativo?: boolean | null;
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
          'application/json': components['schemas']['Page_ResourceAdminRead_'];
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
  create_resource_api_v1_admin_recursos_post: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['ResourceCreate'];
      };
    };
    responses: {
      /** @description Successful Response */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ResourceAdminRead'];
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
      /** @description Já existe um recurso com este nome no bloco */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
      /** @description Bloco desativado ou característica inexistente */
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
  get_resource_api_v1_admin_recursos__resource_id__get: {
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
          'application/json': components['schemas']['ResourceAdminRead'];
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
      /** @description Recurso inexistente */
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
  update_resource_api_v1_admin_recursos__resource_id__put: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        resource_id: number;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['ResourceUpdate'];
      };
    };
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ResourceAdminRead'];
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
      /** @description Recurso inexistente */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
      /** @description Já existe um recurso com este nome no bloco */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
      /** @description Bloco desativado ou característica inexistente */
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
  remove_resource_api_v1_admin_recursos__resource_id__delete: {
    parameters: {
      query?: {
        /** @description Cancela as reservas futuras */
        forcar?: boolean;
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
          'application/json': components['schemas']['RemovalRead'];
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
      /** @description Recurso inexistente */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
      /** @description Há reservas futuras e `forcar` é falso */
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
  reactivate_resource_api_v1_admin_recursos__resource_id__reativar_post: {
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
          'application/json': components['schemas']['ResourceAdminRead'];
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
      /** @description Recurso inexistente */
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
  list_features_api_v1_admin_caracteristicas_get: {
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
          'application/json': components['schemas']['FeatureAdminRead'][];
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
    };
  };
  create_feature_api_v1_admin_caracteristicas_post: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['FeatureCreate'];
      };
    };
    responses: {
      /** @description Successful Response */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['FeatureAdminRead'];
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
      /** @description Já existe uma característica com este nome */
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
  update_feature_api_v1_admin_caracteristicas__feature_id__put: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        feature_id: number;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['FeatureUpdate'];
      };
    };
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['FeatureAdminRead'];
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
      /** @description Característica inexistente */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
      /** @description Já existe uma característica com este nome */
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
  remove_feature_api_v1_admin_caracteristicas__feature_id__delete: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        feature_id: number;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful Response */
      204: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
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
      /** @description Característica inexistente */
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
  list_agenda_api_v1_admin_reservas_get: {
    parameters: {
      query?: {
        page?: number;
        per_page?: number;
        /** @description Dia no fuso do campus; padrão: hoje */
        data?: string | null;
        bloco_id?: number | null;
        recurso_id?: number | null;
        status?: components['schemas']['ReservationStatus'] | null;
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
          'application/json': components['schemas']['Page_AdminReservationRead_'];
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
  cancel_reservation_api_v1_admin_reservas__reservation_id__cancelar_post: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        reservation_id: number;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['AdminCancellation'];
      };
    };
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['AdminReservationRead'];
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
      /** @description Reserva inexistente */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
      /** @description Reserva já cancelada */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
      /** @description Reserva já terminou ou motivo inválido */
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
}
