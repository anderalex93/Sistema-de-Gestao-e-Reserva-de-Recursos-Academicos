// Gerado por `npm run gen:api` a partir do OpenAPI do backend. Não edite à mão.

export interface paths {
  '/api/v1/health': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Verifica se a API e o banco estão respondendo
     * @description Público, para o monitoramento e o health check do deploy. Faz uma consulta mínima ao banco.
     */
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
    /**
     * Cria a própria conta (perfil Aluno)
     * @description O perfil é sempre `ALUNO`; professor e administrador são criados pela administração. Quando o servidor restringe domínios, o e-mail precisa ser institucional (ex.: `@umj.edu.br`). O aceite do Aviso de Privacidade e dos Termos de Uso (`aceite_termos: true`) é obrigatório e fica registrado com data. Senha com 8 a 128 caracteres, com letras e números; matrícula opcional. Limite de 10 cadastros por minuto por IP.
     */
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
    /**
     * Entra com e-mail e senha e recebe o token de acesso
     * @description Devolve um token Bearer (JWT) válido por `expires_in` segundos e os dados da conta. Envie-o no cabeçalho `Authorization: Bearer <token>`. E-mail inexistente e senha errada dão a mesma resposta. Limite de 20 tentativas por minuto por IP.
     */
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
    /**
     * Dados de quem está logado
     * @description Usado para restaurar a sessão. `aceite_termos_em` vazio indica conta criada pelo administrador que ainda precisa aceitar os termos.
     */
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
     * @description Para contas criadas pelo administrador, no primeiro acesso (`aceite_termos_em` vazio). Chamar de novo não altera nada: a data do primeiro aceite é a prova do consentimento.
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
    /**
     * Exporta todos os meus dados em JSON (LGPD, Art. 18)
     * @description Dados da conta e todas as reservas feitas por ela, de qualquer status, com recurso, bloco, horários, finalidade e motivo de cancelamento. Atende aos direitos de acesso e portabilidade do titular.
     */
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
     * @description Pede a senha atual. A conta é anonimizada e desativada: nome, e-mail e matrícula somem, as reservas antigas ficam no histórico do espaço sem identificar ninguém e as futuras são canceladas. Administradores não podem se excluir por aqui. Limite de 20 tentativas por minuto por IP.
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
    /**
     * Horário de funcionamento e regras de reserva (público)
     * @description Sem login. Fuso, tamanho do intervalo da grade, horário de cada dia da semana, duração máxima, antecedência máxima e limite de reservas ativas por perfil, como estão configurados no servidor. O front usa estes valores para montar a grade e validar o formulário antes de chamar `POST /api/v1/reservas`.
     */
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
    /**
     * Lista os blocos do campus
     * @description Só os blocos ativos, em ordem de nome, para o filtro da busca.
     */
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
    /**
     * Lista as características usadas nos filtros
     * @description Todas as características cadastradas, em ordem de nome.
     */
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
    /**
     * Busca recursos para reservar, com filtros e horário livre
     * @description Só recursos ativos de blocos ativos, paginados. Os filtros se combinam com E e `caracteristicas` exige todas as informadas. Com `inicio` e `fim` (sempre juntos, com fuso), traz só recursos sem reserva confirmada que se sobreponha ao intervalo; o intervalo não pode ter começado.
     */
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
    /**
     * Detalhe de um recurso
     * @description Recurso desativado, ou de bloco desativado, responde 404 como se não existisse.
     */
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
     * @description Dia no fuso do campus (America/Maceio). Cada horário vem `LIVRE`, `OCUPADO` ou `PASSADO`. Dia em que o campus não abre volta sem horários. Quem reservou só é identificado para administradores. Reserva sem check-in até o fim da tolerância é liberada antes de montar a grade, e o horário restante volta a aparecer `LIVRE`.
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
    /**
     * Reserva um recurso num intervalo livre
     * @description Regras, com os valores atuais em `GET /api/v1/config/regras`:
     *
     *     - `inicio` e `fim` com fuso, em blocos de 30 minutos alinhados (horas cheias ou meias horas), dentro do horário de funcionamento do campus e sem ter começado;
     *     - duração máxima por reserva (padrão 4 horas);
     *     - antecedência máxima em dias (padrão 14);
     *     - limite de reservas ativas (confirmadas e não terminadas) por perfil: padrão 3 para aluno e 10 para professor; administrador não tem limite;
     *     - `qtd_participantes`, se informada, não passa da capacidade do espaço.
     *
     *     O banco impede duas reservas confirmadas sobrepostas no mesmo recurso: quem chega depois recebe `409 RESERVA_CONFLITO`. A resposta traz o `codigo` do comprovante.
     */
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
    /**
     * Minhas reservas: próximas ou histórico
     * @description `escopo=proximas` (padrão): confirmadas que ainda não terminaram, da mais cedo para a mais tarde. `escopo=historico`: canceladas, liberadas por não comparecimento (`NAO_COMPARECEU`) ou já terminadas, da mais recente para a mais antiga. Cada item diz se ainda pode ser cancelado (`pode_cancelar`).
     */
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
    /**
     * Verificação pública de um comprovante (sem login)
     * @description Para conferir a reserva na entrada do espaço, pelo código ou QR Code do comprovante. Mostra recurso, horário e situação, e de quem reservou só o primeiro nome (LGPD, minimização). Limite de 60 consultas por minuto por IP, contra varredura de códigos.
     */
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
    /**
     * Detalhe de uma reserva (dono ou administrador)
     * @description Para qualquer outra pessoa a reserva responde 404, sem revelar que existe.
     */
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
    /**
     * Cancela uma reserva (até 30 minutos antes do início)
     * @description Nada é apagado: a reserva fica `CANCELADA` e o horário volta a ficar livre. Quem reservou cancela até 30 minutos antes do início, pelo relógio do servidor; o administrador cancela as próprias a qualquer momento. Reserva de outra pessoa a administração cancela por `POST /api/v1/admin/reservas/{id}/cancelar`, com motivo.
     */
    post: operations['cancel_reservation_api_v1_reservas__reservation_id__cancelar_post'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/reservas/{reservation_id}/encerrar': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Encerra o uso antes do fim e libera o resto do horário
     * @description Quem reservou avisa que saiu. Só vale para reserva `CONFIRMADA` em andamento (`inicio <= agora < fim`, relógio do servidor). O novo `fim` é a próxima marca de 30 minutos depois de agora, nunca antes de `inicio + 30 min`; o fim original fica em `fim_previsto` e o trecho entre os dois volta a ficar livre na grade. `encerrada_em` registra o momento.
     */
    post: operations['end_reservation_early_api_v1_reservas__reservation_id__encerrar_post'];
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
     * @description Para cada recurso ativo, os intervalos já reservados no dia (fuso do campus), com filtro opcional por bloco e tipo. Dia em que o campus não abre volta sem horário e sem linhas. Quem reservou só é identificado para administradores.
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
  '/api/v1/checkin/{token}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * O que a leitura do QR Code de um espaço encontra para quem leu
     * @description Não registra nada: mostra o espaço e a situação da reserva de quem leu nele hoje (fuso do campus). A janela de check-in vai de `checkin_antecedencia_min` antes do início até `checkin_tolerancia_min` depois (`GET /api/v1/config/regras`). Situações:
     *
     *     - `DISPONIVEL`: dentro da janela e sem check-in;
     *     - `FEITO`: check-in já feito numa reserva que não terminou; `pode_encerrar` diz se dá para encerrar o uso agora (`POST /api/v1/reservas/{id}/encerrar`);
     *     - `ENCERRADA`: quem leu encerrou o uso mais cedo e o fim original ainda não chegou;
     *     - `CEDO`: há reserva confirmada mais tarde hoje; `abre_em` diz quando a janela abre;
     *     - `LIBERADA`: a reserva virou `NAO_COMPARECEU` e ainda não terminou;
     *     - `SEM_RESERVA`: nenhuma das anteriores (`reserva` nula).
     *
     *     Antes de responder, libera as reservas vencidas sem check-in.
     */
    get: operations['get_checkin_status_api_v1_checkin__token__get'];
    put?: never;
    /**
     * Faz check-in na reserva de agora neste espaço
     * @description Registra `checkin_em` na reserva de quem leu o QR Code, se ela está na janela de check-in. Repetir depois do check-in devolve a mesma reserva, sem mudar nada. Sem check-in até `checkin_tolerancia_min` depois do início, a reserva vira `NAO_COMPARECEU` e o horário volta a ficar livre para outras pessoas.
     */
    post: operations['check_in_api_v1_checkin__token__post'];
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
    /**
     * Lista e busca usuários
     * @description Paginada e em ordem de nome, com contas ativas e desativadas. `busca` procura por trecho do nome, do e-mail ou da matrícula.
     */
    get: operations['list_users_api_v1_admin_usuarios_get'];
    put?: never;
    /**
     * Cria a conta de um aluno, professor ou administrador
     * @description O administrador escolhe o perfil (padrão `ALUNO`) e não há restrição de domínio de e-mail. A pessoa aceita o Aviso de Privacidade e os Termos de Uso no primeiro acesso (`POST /api/v1/auth/me/aceite-termos`): o administrador não consente por ela. Senha com 8 a 128 caracteres, com letras e números.
     */
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
    /**
     * Lista todos os blocos, ativos e desativados
     * @description Ativos primeiro, cada um com o total de recursos cadastrados (ativos ou não). Quem reserva usa `GET /api/v1/blocos`, que traz só os ativos.
     */
    get: operations['list_buildings_api_v1_admin_blocos_get'];
    put?: never;
    /**
     * Cria um bloco
     * @description O nome é único entre todos os blocos, inclusive os desativados. Descrição em branco é gravada como nula.
     */
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
    /**
     * Altera nome e descrição de um bloco
     * @description Substitui os dois campos. Desativar e reativar têm rotas próprias (`DELETE` e `/reativar`).
     */
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
    /**
     * Reativa um bloco desativado
     * @description O bloco volta para a busca com os recursos que estavam ativos nele. Recursos desativados um a um continuam desativados.
     */
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
    /**
     * Lista recursos ativos e desativados, com busca e filtros
     * @description Paginada. `busca` procura no nome; sem o filtro `ativo`, traz ativos e desativados, inclusive os de blocos desativados.
     */
    get: operations['list_resources_api_v1_admin_recursos_get'];
    put?: never;
    /**
     * Cria um recurso, que aparece na busca na hora
     * @description Só em bloco ativo. Sala, laboratório e auditório exigem `capacidade`; só equipamento pode ficar sem. O nome é único dentro do bloco e as características precisam existir.
     */
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
    /**
     * Detalhe de um recurso, mesmo desativado
     * @description Traz a situação do recurso e a do bloco, para a tela de edição.
     */
    get: operations['get_resource_api_v1_admin_recursos__resource_id__get'];
    /**
     * Altera todos os dados de um recurso
     * @description Substitui todos os campos, inclusive a lista de características. Mudar de bloco só para um bloco ativo; recurso que já está num bloco desativado pode ser editado sem sair dele. As reservas existentes não mudam.
     */
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
    /**
     * Reativa um recurso desativado
     * @description O recurso volta para a busca, desde que o bloco dele também esteja ativo. Reservas canceladas na desativação não voltam.
     */
    post: operations['reactivate_resource_api_v1_admin_recursos__resource_id__reativar_post'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/admin/recursos/{resource_id}/checkin/renovar': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Gera um novo QR Code de check-in para o recurso
     * @description Troca o `checkin_token` do recurso. Os QR Codes já impressos param de valer na hora (`QR_INVALIDO`): use quando um código vazar ou for copiado para fora do espaço.
     */
    post: operations['renew_checkin_token_api_v1_admin_recursos__resource_id__checkin_renovar_post'];
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
    /**
     * Lista as características com quantos recursos usam cada uma
     * @description Ordem alfabética. O total ajuda a decidir se vale renomear ou excluir.
     */
    get: operations['list_features_api_v1_admin_caracteristicas_get'];
    put?: never;
    /**
     * Cria uma característica
     * @description Atributo usado no filtro da busca (projetor, ar-condicionado...). O nome é único e tem de 2 a 60 caracteres.
     */
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
    /**
     * Renomeia uma característica
     * @description O novo nome passa a valer em todos os recursos que já a usam.
     */
    put: operations['update_feature_api_v1_admin_caracteristicas__feature_id__put'];
    post?: never;
    /**
     * Exclui uma característica e a retira dos recursos que a usam
     * @description É só um atributo de busca: os recursos continuam cadastrados, apenas sem ela. Não há como desfazer.
     */
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
     * @description Reservas que tocam o dia no fuso do campus, de qualquer status, ordenadas por bloco, recurso e horário. Sem `data`, usa o dia de hoje. `status=NAO_COMPARECEU` lista as reservas liberadas porque ninguém fez check-in a tempo.
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
     * @description Sem o prazo de 30 minutos, para manutenção ou evento institucional. Vale para reservas de qualquer pessoa enquanto não terminaram. O motivo (5 a 300 caracteres) aparece no histórico de quem reservou.
     */
    post: operations['cancel_reservation_api_v1_admin_reservas__reservation_id__cancelar_post'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/admin/ocupacao': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Painel de ocupação: uso dos espaços, cancelamentos e não comparecimentos
     * @description Período em dias do fuso do campus, `inicio` e `fim` inclusivos (AAAA-MM-DD). Sem datas, os últimos 30 dias até hoje; só com `fim`, os 30 dias que terminam nele; só com `inicio`, até hoje. No máximo 92 dias. `bloco_id` restringe aos recursos do bloco. Considera os recursos ativos em blocos ativos. Antes de calcular, libera as reservas vencidas sem check-in.
     *
     *     - `horas_disponiveis`: horas de funcionamento de cada dia do período, somadas por recurso.
     *     - `horas_reservadas` e `taxa_ocupacao`: só reservas `CONFIRMADA`, recortadas ao período e ao funcionamento. Canceladas e não comparecimentos não ocupam.
     *     - `reservas` (`CONFIRMADA` e `NAO_COMPARECEU`) e `cancelamentos` contam as que começam no período; `checkins`, só as que já começaram.
     *     - `taxa_comparecimento` é nula quando não há check-in nem não comparecimento.
     *     - `horas_devolvidas`: da liberação ao fim de cada `NAO_COMPARECEU`, horas que voltaram a ficar livres.
     *     - `mapa_calor`: ocupação por dia da semana (1 = segunda) e hora local, só nas horas em que o campus abre.
     *     - `recursos`: da maior para a menor ocupação, depois por nome.
     */
    get: operations['get_occupancy_api_v1_admin_ocupacao_get'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/admin/ocupacao.csv': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Planilha do painel de ocupação, uma linha por recurso
     * @description Período em dias do fuso do campus, `inicio` e `fim` inclusivos (AAAA-MM-DD). Sem datas, os últimos 30 dias até hoje; só com `fim`, os 30 dias que terminam nele; só com `inicio`, até hoje. No máximo 92 dias. `bloco_id` restringe aos recursos do bloco. Considera os recursos ativos em blocos ativos. Antes de calcular, libera as reservas vencidas sem check-in.
     *
     *     CSV para o Excel em pt-BR: UTF-8 com BOM, colunas separadas por `;` e vírgula decimal. Colunas: Recurso, Bloco, Tipo, Horas disponíveis, Horas reservadas, Ocupação (%), Reservas, Cancelamentos, Não comparecimentos e Horas devolvidas, na ordem do painel. Sem dados pessoais. Vem como anexo `ocupacao-AAAA-MM-DD-a-AAAA-MM-DD.csv`.
     */
    get: operations['export_occupancy_csv_api_v1_admin_ocupacao_csv_get'];
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
    /** AccountDeletion */
    AccountDeletion: {
      /**
       * Senha
       * @description Senha atual, para confirmar
       */
      senha: string;
    };
    /**
     * AdminCancellation
     * @example {
     *       "motivo": "Manutenção do ar-condicionado da sala."
     *     }
     */
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
      /**
       * Checkin Em
       * @description Quando quem reservou fez check-in pelo QR Code do espaço
       */
      checkin_em: string | null;
      /**
       * Liberada Em
       * @description Quando a reserva virou `NAO_COMPARECEU` e o horário foi liberado
       */
      liberada_em: string | null;
      /**
       * Encerrada Em
       * @description Quando quem reservou encerrou o uso antes do fim
       */
      encerrada_em: string | null;
      /**
       * Fim Previsto
       * @description O fim original, só quando o encerramento antecipado encurtou a reserva; o trecho entre `fim` e `fim_previsto` voltou a ficar livre
       */
      fim_previsto: string | null;
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
    /**
     * BuildingCreate
     * @example {
     *       "descricao": "Laboratórios e salas de estudo",
     *       "nome": "Bloco C"
     *     }
     */
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
     * @example {
     *       "descricao": "Laboratórios e salas de estudo",
     *       "nome": "Bloco C"
     *     }
     */
    BuildingUpdate: {
      /** Nome */
      nome: string;
      /** Descricao */
      descricao?: string | null;
    };
    /**
     * CheckinResourceRead
     * @description O espaço do QR Code, para a pessoa conferir que está no lugar certo.
     */
    CheckinResourceRead: {
      /** Id */
      id: number;
      /** Nome */
      nome: string;
      tipo: components['schemas']['ResourceType'];
      /** Andar */
      andar: string | null;
      bloco: components['schemas']['BuildingRead'];
    };
    /**
     * CheckinSituation
     * @description O que a leitura do QR Code de um espaço encontra para quem leu (#43).
     * @enum {string}
     */
    CheckinSituation: 'DISPONIVEL' | 'FEITO' | 'ENCERRADA' | 'CEDO' | 'LIBERADA' | 'SEM_RESERVA';
    /** CheckinStatusRead */
    CheckinStatusRead: {
      recurso: components['schemas']['CheckinResourceRead'];
      /** @description `DISPONIVEL`: dá para fazer check-in agora. `FEITO`: check-in já feito numa reserva que não terminou. `ENCERRADA`: quem leu encerrou o uso mais cedo e o fim original ainda não chegou. `CEDO`: há reserva confirmada mais tarde hoje; a janela abre em `abre_em`. `LIBERADA`: a reserva de agora virou `NAO_COMPARECEU`. `SEM_RESERVA`: nenhuma reserva de quem leu neste espaço para hoje */
      situacao: components['schemas']['CheckinSituation'];
      /** @description A reserva de quem leu neste espaço hoje a que a situação se refere */
      reserva: components['schemas']['ReservationRead'] | null;
      /**
       * Abre Em
       * @description Quando a janela de check-in abre; só na situação `CEDO`
       */
      abre_em: string | null;
      /**
       * Pode Encerrar
       * @description A reserva já começou e o uso ainda não foi encerrado: dá para encerrar agora por `POST /api/v1/reservas/{reserva.id}/encerrar`
       */
      pode_encerrar: boolean;
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
    /**
     * FeatureCreate
     * @example {
     *       "nome": "Projetor"
     *     }
     */
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
    /**
     * FeatureUpdate
     * @example {
     *       "nome": "Projetor"
     *     }
     */
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
    /** HeatmapCellRead */
    HeatmapCellRead: {
      /**
       * Dia Semana
       * @description ISO 8601: 1 = segunda, 7 = domingo
       */
      dia_semana: number;
      /**
       * Hora
       * @description Início da hora no fuso do campus
       */
      hora: number;
      /**
       * Taxa
       * @description Minutos reservados naquela hora daquele dia da semana / minutos disponíveis (recursos x dias x minutos de funcionamento na hora). De 0 a 1
       */
      taxa: number;
    };
    /**
     * LoginRequest
     * @example {
     *       "email": "ana.exemplo@umj.edu.br",
     *       "senha": "Estudo2026"
     *     }
     */
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
       * Checkin Em
       * @description Quando quem reservou fez check-in pelo QR Code do espaço
       */
      checkin_em: string | null;
      /**
       * Liberada Em
       * @description Quando a reserva virou `NAO_COMPARECEU` e o horário foi liberado
       */
      liberada_em: string | null;
      /**
       * Encerrada Em
       * @description Quando quem reservou encerrou o uso antes do fim
       */
      encerrada_em: string | null;
      /**
       * Fim Previsto
       * @description O fim original, só quando o encerramento antecipado encurtou a reserva; o trecho entre `fim` e `fim_previsto` voltou a ficar livre
       */
      fim_previsto: string | null;
      /**
       * Pode Cancelar
       * @description Confirmada e com pelo menos 30 minutos até o início (RF04)
       */
      pode_cancelar: boolean;
      /**
       * Pode Encerrar
       * @description Confirmada, em andamento e com o uso ainda não encerrado
       */
      pode_encerrar: boolean;
    };
    /** OccupancyPeriodRead */
    OccupancyPeriodRead: {
      /**
       * Inicio
       * Format: date
       */
      inicio: string;
      /**
       * Fim
       * Format: date
       * @description Inclusive
       */
      fim: string;
    };
    /**
     * OccupancyRead
     * @example {
     *       "mapa_calor": [
     *         {
     *           "dia_semana": 1,
     *           "hora": 8,
     *           "taxa": 0.35
     *         }
     *       ],
     *       "periodo": {
     *         "fim": "2026-10-30",
     *         "inicio": "2026-10-01"
     *       },
     *       "recursos": [
     *         {
     *           "bloco": "Bloco B",
     *           "cancelamentos": 5,
     *           "horas_devolvidas": 4.5,
     *           "horas_disponiveis": 338,
     *           "horas_reservadas": 250,
     *           "id": 3,
     *           "nao_comparecimentos": 3,
     *           "nome": "Laboratório de Informática 1",
     *           "reservas": 96,
     *           "taxa_ocupacao": 0.74,
     *           "tipo": "LABORATORIO"
     *         }
     *       ],
     *       "resumo": {
     *         "cancelamentos": 64,
     *         "checkins": 690,
     *         "horas_devolvidas": 52.5,
     *         "horas_disponiveis": 3380,
     *         "horas_reservadas": 1622.5,
     *         "nao_comparecimentos": 41,
     *         "reservas": 812,
     *         "taxa_cancelamento": 0.073,
     *         "taxa_comparecimento": 0.944,
     *         "taxa_ocupacao": 0.48
     *       }
     *     }
     */
    OccupancyRead: {
      periodo: components['schemas']['OccupancyPeriodRead'];
      resumo: components['schemas']['OccupancySummaryRead'];
      /**
       * Mapa Calor
       * @description Só horas em que o campus abre naquele dia da semana, por dia e hora
       */
      mapa_calor: components['schemas']['HeatmapCellRead'][];
      /**
       * Recursos
       * @description Recursos ativos do filtro, da maior para a menor ocupação, depois por nome
       */
      recursos: components['schemas']['ResourceOccupancyRead'][];
    };
    /** OccupancySummaryRead */
    OccupancySummaryRead: {
      /**
       * Horas Disponiveis
       * @description Horas de funcionamento do período somadas por recurso ativo
       */
      horas_disponiveis: number;
      /**
       * Horas Reservadas
       * @description Horas de reservas `CONFIRMADA` dentro do período e do funcionamento
       */
      horas_reservadas: number;
      /**
       * Taxa Ocupacao
       * @description Reservadas / disponíveis. De 0 a 1
       */
      taxa_ocupacao: number;
      /**
       * Reservas
       * @description `CONFIRMADA` ou `NAO_COMPARECEU` que começam no período (sem canceladas)
       */
      reservas: number;
      /**
       * Cancelamentos
       * @description `CANCELADA` que começariam no período
       */
      cancelamentos: number;
      /**
       * Taxa Cancelamento
       * @description Cancelamentos / (reservas + cancelamentos). De 0 a 1; 0 sem reservas
       */
      taxa_cancelamento: number;
      /**
       * Checkins
       * @description Reservas do período que já começaram e tiveram check-in
       */
      checkins: number;
      /**
       * Nao Comparecimentos
       * @description `NAO_COMPARECEU`: sem check-in a tempo, horário liberado
       */
      nao_comparecimentos: number;
      /**
       * Taxa Comparecimento
       * @description Check-ins / (check-ins + não comparecimentos). De 0 a 1; nulo quando não há nenhum
       */
      taxa_comparecimento: number | null;
      /**
       * Horas Devolvidas
       * @description Horas que voltaram a ficar livres: por não comparecimento (da liberação ao fim da reserva) e por uso encerrado mais cedo (do novo fim ao fim original)
       */
      horas_devolvidas: number;
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
      /**
       * Checkin Em
       * @description Quando quem reservou fez check-in
       */
      checkin_em: string | null;
      /**
       * Encerrada Em
       * @description Quando quem reservou encerrou o uso antes do fim
       */
      encerrada_em: string | null;
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
    /**
     * ReservationCreate
     * @example {
     *       "fim": "2026-11-20T16:00:00-03:00",
     *       "finalidade": "Estudo em grupo para a prova de Cálculo II",
     *       "inicio": "2026-11-20T14:00:00-03:00",
     *       "qtd_participantes": 4,
     *       "recurso_id": 1
     *     }
     */
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
      /**
       * Checkin Em
       * @description Quando quem reservou fez check-in pelo QR Code do espaço
       */
      checkin_em: string | null;
      /**
       * Liberada Em
       * @description Quando a reserva virou `NAO_COMPARECEU` e o horário foi liberado
       */
      liberada_em: string | null;
      /**
       * Encerrada Em
       * @description Quando quem reservou encerrou o uso antes do fim
       */
      encerrada_em: string | null;
      /**
       * Fim Previsto
       * @description O fim original, só quando o encerramento antecipado encurtou a reserva; o trecho entre `fim` e `fim_previsto` voltou a ficar livre
       */
      fim_previsto: string | null;
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
    ReservationStatus: 'CONFIRMADA' | 'CANCELADA' | 'NAO_COMPARECEU';
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
      /**
       * Checkin Token
       * @description Vai no QR Code de check-in afixado no espaço e é lido por `/api/v1/checkin/{token}`. Renovar invalida os QR Codes já impressos
       */
      checkin_token: string;
    };
    /**
     * ResourceCreate
     * @example {
     *       "andar": "2º andar",
     *       "bloco_id": 1,
     *       "capacidade": 30,
     *       "caracteristica_ids": [
     *         1,
     *         2
     *       ],
     *       "descricao": "Computadores com IDE e acesso à rede do campus",
     *       "nome": "Laboratório de Informática 2",
     *       "tipo": "LABORATORIO"
     *     }
     */
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
    /** ResourceOccupancyRead */
    ResourceOccupancyRead: {
      /** Id */
      id: number;
      /** Nome */
      nome: string;
      tipo: components['schemas']['ResourceType'];
      /**
       * Bloco
       * @description Nome do bloco
       */
      bloco: string;
      /**
       * Horas Disponiveis
       * @description Horas com uma casa decimal
       */
      horas_disponiveis: number;
      /**
       * Horas Reservadas
       * @description Horas com uma casa decimal
       */
      horas_reservadas: number;
      /**
       * Taxa Ocupacao
       * @description De 0 a 1
       */
      taxa_ocupacao: number;
      /** Reservas */
      reservas: number;
      /** Cancelamentos */
      cancelamentos: number;
      /** Nao Comparecimentos */
      nao_comparecimentos: number;
      /**
       * Horas Devolvidas
       * @description Horas com uma casa decimal
       */
      horas_devolvidas: number;
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
     * @example {
     *       "andar": "2º andar",
     *       "bloco_id": 1,
     *       "capacidade": 30,
     *       "caracteristica_ids": [
     *         1,
     *         2
     *       ],
     *       "descricao": "Computadores com IDE e acesso à rede do campus",
     *       "nome": "Laboratório de Informática 2",
     *       "tipo": "LABORATORIO"
     *     }
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
      /**
       * Checkin Tolerancia Min
       * @description Minutos depois do início para fazer check-in; sem check-in, a reserva vira `NAO_COMPARECEU` e o horário é liberado. 0 = check-in opcional, sem liberação
       */
      checkin_tolerancia_min: number;
      /**
       * Checkin Antecedencia Min
       * @description Minutos antes do início em que a janela de check-in abre
       */
      checkin_antecedencia_min: number;
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
     * @example {
     *       "email": "carlos.exemplo@umj.edu.br",
     *       "nome": "Carlos Exemplo Lima",
     *       "perfil": "PROFESSOR",
     *       "senha": "Docente2026"
     *     }
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
     * @example {
     *       "aceite_termos": true,
     *       "email": "ana.exemplo@umj.edu.br",
     *       "matricula": "20261001",
     *       "nome": "Ana Exemplo Souza",
     *       "senha": "Estudo2026"
     *     }
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
      /** @description Banco de dados indisponível (`BANCO_INDISPONIVEL`) */
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
      /** @description E-mail (`EMAIL_JA_CADASTRADO`) ou matrícula (`MATRICULA_JA_CADASTRADA`) já cadastrados */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
      /** @description E-mail fora do domínio institucional (`DOMINIO_NAO_PERMITIDO`). Campos inválidos, como aceite ausente ou senha fraca, voltam no formato de validação do FastAPI, com `detail` em lista */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
      /** @description Muitas tentativas seguidas do mesmo IP (`MUITAS_TENTATIVAS`) */
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
      /** @description E-mail ou senha incorretos (`CREDENCIAIS_INVALIDAS`) */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
      /** @description Conta desativada (`USUARIO_INATIVO`) */
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
      /** @description Muitas tentativas seguidas do mesmo IP (`MUITAS_TENTATIVAS`) */
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
      /** @description Sem sessão válida: token ausente (`NAO_AUTENTICADO`) ou expirado, inválido ou de conta desativada (`SESSAO_INVALIDA`) */
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
      /** @description Sem sessão válida: token ausente (`NAO_AUTENTICADO`) ou expirado, inválido ou de conta desativada (`SESSAO_INVALIDA`) */
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
      /** @description Sem sessão válida: token ausente (`NAO_AUTENTICADO`) ou expirado, inválido ou de conta desativada (`SESSAO_INVALIDA`) */
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
      /** @description Sem sessão válida: token ausente (`NAO_AUTENTICADO`) ou expirado, inválido ou de conta desativada (`SESSAO_INVALIDA`) */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
      /** @description Senha incorreta (`SENHA_INCORRETA`) ou conta de administrador (`OPERACAO_NAO_PERMITIDA`) */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
      /** @description Muitas tentativas seguidas do mesmo IP (`MUITAS_TENTATIVAS`) */
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
      /** @description Sem sessão válida: token ausente (`NAO_AUTENTICADO`) ou expirado, inválido ou de conta desativada (`SESSAO_INVALIDA`) */
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
      /** @description Sem sessão válida: token ausente (`NAO_AUTENTICADO`) ou expirado, inválido ou de conta desativada (`SESSAO_INVALIDA`) */
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
      /** @description Sem sessão válida: token ausente (`NAO_AUTENTICADO`) ou expirado, inválido ou de conta desativada (`SESSAO_INVALIDA`) */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
      /** @description Intervalo no passado (`INTERVALO_NO_PASSADO`), incompleto ou com o fim antes do início */
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
      /** @description Sem sessão válida: token ausente (`NAO_AUTENTICADO`) ou expirado, inválido ou de conta desativada (`SESSAO_INVALIDA`) */
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
      /** @description Sem sessão válida: token ausente (`NAO_AUTENTICADO`) ou expirado, inválido ou de conta desativada (`SESSAO_INVALIDA`) */
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
      /** @description Sem sessão válida: token ausente (`NAO_AUTENTICADO`) ou expirado, inválido ou de conta desativada (`SESSAO_INVALIDA`) */
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
      /** @description Horário já ocupado por outra reserva (`RESERVA_CONFLITO`) */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
      /** @description Fora das regras: `INTERVALO_NO_PASSADO`, `HORARIO_FORA_DA_GRADE`, `FORA_DO_FUNCIONAMENTO`, `CAPACIDADE_EXCEDIDA`, `DURACAO_EXCEDIDA`, `ANTECEDENCIA_EXCEDIDA` ou `LIMITE_RESERVAS_ATIVAS`. Campos inválidos, como fim antes do início, voltam no formato de validação do FastAPI */
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
      /** @description Sem sessão válida: token ausente (`NAO_AUTENTICADO`) ou expirado, inválido ou de conta desativada (`SESSAO_INVALIDA`) */
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
      /** @description Código inexistente (`COMPROVANTE_NAO_ENCONTRADO`) */
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
      /** @description Muitas tentativas seguidas do mesmo IP (`MUITAS_TENTATIVAS`) */
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
      /** @description Sem sessão válida: token ausente (`NAO_AUTENTICADO`) ou expirado, inválido ou de conta desativada (`SESSAO_INVALIDA`) */
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
      /** @description Sem sessão válida: token ausente (`NAO_AUTENTICADO`) ou expirado, inválido ou de conta desativada (`SESSAO_INVALIDA`) */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
      /** @description A reserva é de outra pessoa (`ACESSO_NEGADO`) */
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
      /** @description Reserva já cancelada (`RESERVA_JA_CANCELADA`) ou liberada por não comparecimento (`RESERVA_LIBERADA`) */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
      /** @description Fora do prazo de cancelamento (`PRAZO_CANCELAMENTO_EXPIRADO`) */
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
  end_reservation_early_api_v1_reservas__reservation_id__encerrar_post: {
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
      /** @description Sem sessão válida: token ausente (`NAO_AUTENTICADO`) ou expirado, inválido ou de conta desativada (`SESSAO_INVALIDA`) */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
      /** @description A reserva é de outra pessoa (`ACESSO_NEGADO`) */
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
      /** @description Uso já encerrado (`RESERVA_JA_ENCERRADA`), reserva cancelada (`RESERVA_JA_CANCELADA`) ou liberada por não comparecimento (`RESERVA_LIBERADA`) */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
      /** @description A reserva ainda não começou (`RESERVA_NAO_INICIADA`) ou já terminou (`RESERVA_ENCERRADA`) */
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
      /** @description Sem sessão válida: token ausente (`NAO_AUTENTICADO`) ou expirado, inválido ou de conta desativada (`SESSAO_INVALIDA`) */
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
  get_checkin_status_api_v1_checkin__token__get: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description Token do QR Code afixado no espaço */
        token: string;
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
          'application/json': components['schemas']['CheckinStatusRead'];
        };
      };
      /** @description Sem sessão válida: token ausente (`NAO_AUTENTICADO`) ou expirado, inválido ou de conta desativada (`SESSAO_INVALIDA`) */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
      /** @description Token inexistente ou de recurso desativado (`QR_INVALIDO`) */
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
  check_in_api_v1_checkin__token__post: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description Token do QR Code afixado no espaço */
        token: string;
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
      /** @description Sem sessão válida: token ausente (`NAO_AUTENTICADO`) ou expirado, inválido ou de conta desativada (`SESSAO_INVALIDA`) */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
      /** @description Token inexistente ou de recurso desativado (`QR_INVALIDO`), ou nenhuma reserva de quem leu neste espaço para agora (`SEM_RESERVA_AGORA`) */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
      /** @description A reserva foi liberada por falta de check-in no prazo (`RESERVA_LIBERADA`) ou o uso já foi encerrado (`RESERVA_JA_ENCERRADA`) */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
      /** @description A janela de check-in ainda não abriu (`CHECKIN_FORA_DA_JANELA`); a mensagem diz a hora em que abre */
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
      /** @description Sem sessão válida: token ausente (`NAO_AUTENTICADO`) ou expirado, inválido ou de conta desativada (`SESSAO_INVALIDA`) */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
      /** @description Apenas administradores (`ACESSO_NEGADO`) */
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
      /** @description Sem sessão válida: token ausente (`NAO_AUTENTICADO`) ou expirado, inválido ou de conta desativada (`SESSAO_INVALIDA`) */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
      /** @description Apenas administradores (`ACESSO_NEGADO`) */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
      /** @description E-mail (`EMAIL_JA_CADASTRADO`) ou matrícula (`MATRICULA_JA_CADASTRADA`) já cadastrados */
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
      /** @description Sem sessão válida: token ausente (`NAO_AUTENTICADO`) ou expirado, inválido ou de conta desativada (`SESSAO_INVALIDA`) */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
      /** @description Apenas administradores (`ACESSO_NEGADO`) */
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
      /** @description Admin tentando se rebaixar ou se desativar (`OPERACAO_NAO_PERMITIDA`) ou nenhum campo informado */
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
      /** @description Sem sessão válida: token ausente (`NAO_AUTENTICADO`) ou expirado, inválido ou de conta desativada (`SESSAO_INVALIDA`) */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
      /** @description Apenas administradores (`ACESSO_NEGADO`) */
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
      /** @description Sem sessão válida: token ausente (`NAO_AUTENTICADO`) ou expirado, inválido ou de conta desativada (`SESSAO_INVALIDA`) */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
      /** @description Apenas administradores (`ACESSO_NEGADO`) */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
      /** @description Já existe um bloco com este nome (`BLOCO_JA_EXISTE`) */
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
      /** @description Sem sessão válida: token ausente (`NAO_AUTENTICADO`) ou expirado, inválido ou de conta desativada (`SESSAO_INVALIDA`) */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
      /** @description Apenas administradores (`ACESSO_NEGADO`) */
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
      /** @description Já existe um bloco com este nome (`BLOCO_JA_EXISTE`) */
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
      /** @description Sem sessão válida: token ausente (`NAO_AUTENTICADO`) ou expirado, inválido ou de conta desativada (`SESSAO_INVALIDA`) */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
      /** @description Apenas administradores (`ACESSO_NEGADO`) */
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
      /** @description Há reservas futuras e `forcar` é falso (`RESERVAS_FUTURAS`) */
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
      /** @description Sem sessão válida: token ausente (`NAO_AUTENTICADO`) ou expirado, inválido ou de conta desativada (`SESSAO_INVALIDA`) */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
      /** @description Apenas administradores (`ACESSO_NEGADO`) */
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
      /** @description Sem sessão válida: token ausente (`NAO_AUTENTICADO`) ou expirado, inválido ou de conta desativada (`SESSAO_INVALIDA`) */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
      /** @description Apenas administradores (`ACESSO_NEGADO`) */
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
      /** @description Sem sessão válida: token ausente (`NAO_AUTENTICADO`) ou expirado, inválido ou de conta desativada (`SESSAO_INVALIDA`) */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
      /** @description Apenas administradores (`ACESSO_NEGADO`) */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
      /** @description Já existe um recurso com este nome no bloco (`RECURSO_JA_EXISTE`) */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
      /** @description Bloco inexistente ou desativado (`BLOCO_INVALIDO`), característica inexistente (`CARACTERISTICA_INVALIDA`) ou campos inválidos, como capacidade ausente */
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
      /** @description Sem sessão válida: token ausente (`NAO_AUTENTICADO`) ou expirado, inválido ou de conta desativada (`SESSAO_INVALIDA`) */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
      /** @description Apenas administradores (`ACESSO_NEGADO`) */
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
      /** @description Sem sessão válida: token ausente (`NAO_AUTENTICADO`) ou expirado, inválido ou de conta desativada (`SESSAO_INVALIDA`) */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
      /** @description Apenas administradores (`ACESSO_NEGADO`) */
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
      /** @description Já existe um recurso com este nome no bloco (`RECURSO_JA_EXISTE`) */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
      /** @description Bloco inexistente ou desativado (`BLOCO_INVALIDO`), característica inexistente (`CARACTERISTICA_INVALIDA`) ou campos inválidos, como capacidade ausente */
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
      /** @description Sem sessão válida: token ausente (`NAO_AUTENTICADO`) ou expirado, inválido ou de conta desativada (`SESSAO_INVALIDA`) */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
      /** @description Apenas administradores (`ACESSO_NEGADO`) */
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
      /** @description Há reservas futuras e `forcar` é falso (`RESERVAS_FUTURAS`) */
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
      /** @description Sem sessão válida: token ausente (`NAO_AUTENTICADO`) ou expirado, inválido ou de conta desativada (`SESSAO_INVALIDA`) */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
      /** @description Apenas administradores (`ACESSO_NEGADO`) */
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
  renew_checkin_token_api_v1_admin_recursos__resource_id__checkin_renovar_post: {
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
      /** @description Sem sessão válida: token ausente (`NAO_AUTENTICADO`) ou expirado, inválido ou de conta desativada (`SESSAO_INVALIDA`) */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
      /** @description Apenas administradores (`ACESSO_NEGADO`) */
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
      /** @description Sem sessão válida: token ausente (`NAO_AUTENTICADO`) ou expirado, inválido ou de conta desativada (`SESSAO_INVALIDA`) */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
      /** @description Apenas administradores (`ACESSO_NEGADO`) */
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
      /** @description Sem sessão válida: token ausente (`NAO_AUTENTICADO`) ou expirado, inválido ou de conta desativada (`SESSAO_INVALIDA`) */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
      /** @description Apenas administradores (`ACESSO_NEGADO`) */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
      /** @description Já existe uma característica com este nome (`CARACTERISTICA_JA_EXISTE`) */
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
      /** @description Sem sessão válida: token ausente (`NAO_AUTENTICADO`) ou expirado, inválido ou de conta desativada (`SESSAO_INVALIDA`) */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
      /** @description Apenas administradores (`ACESSO_NEGADO`) */
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
      /** @description Já existe uma característica com este nome (`CARACTERISTICA_JA_EXISTE`) */
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
      /** @description Sem sessão válida: token ausente (`NAO_AUTENTICADO`) ou expirado, inválido ou de conta desativada (`SESSAO_INVALIDA`) */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
      /** @description Apenas administradores (`ACESSO_NEGADO`) */
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
      /** @description Sem sessão válida: token ausente (`NAO_AUTENTICADO`) ou expirado, inválido ou de conta desativada (`SESSAO_INVALIDA`) */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
      /** @description Apenas administradores (`ACESSO_NEGADO`) */
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
      /** @description Sem sessão válida: token ausente (`NAO_AUTENTICADO`) ou expirado, inválido ou de conta desativada (`SESSAO_INVALIDA`) */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
      /** @description Apenas administradores (`ACESSO_NEGADO`) */
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
      /** @description Reserva já cancelada (`RESERVA_JA_CANCELADA`) ou liberada por não comparecimento (`RESERVA_LIBERADA`) */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
      /** @description Reserva já terminou (`RESERVA_ENCERRADA`) ou motivo inválido */
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
  get_occupancy_api_v1_admin_ocupacao_get: {
    parameters: {
      query?: {
        /** @description Primeiro dia (AAAA-MM-DD, fuso do campus); padrão: 29 dias antes do fim */
        inicio?: string | null;
        /** @description Último dia, inclusive (AAAA-MM-DD); padrão: hoje */
        fim?: string | null;
        /** @description Só os recursos deste bloco */
        bloco_id?: number | null;
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
          'application/json': components['schemas']['OccupancyRead'];
        };
      };
      /** @description Sem sessão válida: token ausente (`NAO_AUTENTICADO`) ou expirado, inválido ou de conta desativada (`SESSAO_INVALIDA`) */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
      /** @description Apenas administradores (`ACESSO_NEGADO`) */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
      /** @description Período inválido (`PERIODO_INVALIDO`): data final antes da inicial ou mais de 92 dias. Data fora do formato AAAA-MM-DD volta no formato de validação do FastAPI */
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
  export_occupancy_csv_api_v1_admin_ocupacao_csv_get: {
    parameters: {
      query?: {
        /** @description Primeiro dia (AAAA-MM-DD, fuso do campus); padrão: 29 dias antes do fim */
        inicio?: string | null;
        /** @description Último dia, inclusive (AAAA-MM-DD); padrão: hoje */
        fim?: string | null;
        /** @description Só os recursos deste bloco */
        bloco_id?: number | null;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Planilha CSV (anexo) */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'text/csv': string;
        };
      };
      /** @description Sem sessão válida: token ausente (`NAO_AUTENTICADO`) ou expirado, inválido ou de conta desativada (`SESSAO_INVALIDA`) */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
      /** @description Apenas administradores (`ACESSO_NEGADO`) */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ErrorResponse'];
        };
      };
      /** @description Período inválido (`PERIODO_INVALIDO`): data final antes da inicial ou mais de 92 dias. Data fora do formato AAAA-MM-DD volta no formato de validação do FastAPI */
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
