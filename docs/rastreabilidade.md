# Rastreabilidade de requisitos

Issue #37. Liga cada requisito do relatório da Sprint 1 às issues que o implementam, aos commits
na `main` e aos testes automatizados que provam o comportamento. O texto de cada requisito vem
dos épicos #1 a #7.

Como conferir:

- commits: `git log --oneline --grep "#N"` (todo commit cita a issue);
- testes do back: `cd backend && make ci`;
- testes do front: `cd frontend && npm run ci`;
- testes E2E: `cd frontend && npm run e2e`, e o workflow `E2E` a cada push na `main`.

Toda a evidência abaixo é local e de CI. A conferência no ambiente publicado depende de o deploy
versionado na #19 ([docs/deploy.md](deploy.md)) ser colocado no ar.

## Matriz

| Requisito | Issues | Commits | Testes (arquivos) | Situação |
|---|---|---|---|---|
| **RF01** Cadastro e autenticação via e-mail institucional | #15, #16, #17 | `64164d8`, `069c414` | `backend/tests/api/test_auth.py`, `backend/tests/core/test_security.py`, `backend/tests/core/test_config.py`, `frontend/src/pages/auth.test.tsx`, `frontend/e2e/auth.e2e.ts` | Coberto |
| **RF02** Busca e visualização por data, horário e recursos disponíveis | #20, #21, #22, #31, #51 | `62e5276`, `ecaea6d`, `e7b990b`, `a89b653`, `ad1de9f`, `13d5ff0`, `c2de7d1`, `cd4636f`, `fca3d53`, `5bf3109` | `backend/tests/api/test_catalog.py`, `backend/tests/api/test_resource_search.py`, `backend/tests/services/test_availability.py`, `backend/tests/api/test_availability_api.py`, `backend/tests/api/test_board.py`, `frontend/src/pages/catalog.test.tsx`, `frontend/src/pages/resource-search.test.tsx`, `frontend/src/pages/availability.test.tsx`, `frontend/src/pages/board.test.tsx`, `frontend/src/pages/realtime.test.tsx`, `frontend/e2e/reservation.e2e.ts` | Coberto |
| **RF03** Realização e confirmação de reservas em tempo real | #23, #24, #25, #28, #31 | `8b13ac0`, `491651c`, `e4a4a72`, `ee9ea0d`, `459355e`, `a41aa35`, `d4021d7`, `f4bd1b2`, `afae52c`, `f63d059`, `fca3d53` | `backend/tests/services/test_reservation_service.py`, `backend/tests/api/test_reservations_api.py`, `backend/tests/services/test_usage_rules.py`, `backend/tests/services/test_my_reservations.py`, `frontend/src/pages/reservation.test.tsx`, `frontend/src/pages/receipt.test.tsx`, `frontend/src/pages/my-reservations.test.tsx`, `frontend/src/pages/usage-rules.test.tsx`, `frontend/src/pages/realtime.test.tsx`, `frontend/e2e/reservation.e2e.ts` | Coberto |
| **RF04** Cancelamento com no mínimo 30 minutos de antecedência | #26 | `797818a`, `d4021d7` | `backend/tests/services/test_cancellation.py`, `backend/tests/services/test_my_reservations.py`, `backend/tests/api/test_reservations_api.py`, `frontend/src/pages/my-reservations.test.tsx`, `frontend/e2e/reservation.e2e.ts` | Coberto |
| **RNF01** Interface totalmente responsiva | #32, #22, #35 | `6a72cf8`, `5886a26`, `5207290`, `ba3f450` | `frontend/e2e/accessibility.e2e.ts`, `frontend/e2e/mobile.e2e.ts`, `frontend/e2e/keyboard.e2e.ts`, `frontend/e2e/public.e2e.ts`, `frontend/src/layouts/AppLayout.test.tsx`, `frontend/src/pages/admin-catalog.test.tsx` | Coberto, com pendência de Lighthouse (ver abaixo) |
| **RNF02** Consultas de disponibilidade em até 2 segundos | #21, #33 | `e7b990b`, `4634bdd` | `backend/tests/api/test_board.py`, `backend/tests/api/test_process_time.py`, `backend/tests/load/locustfile.py` (script de carga) | Medido localmente; falta a medição em produção |
| **RNF03** Integridade: impedir reservas sobrepostas | #13, #10, #21, #23 | `628353a`, `52b3c3d`, `e7b990b`, `8b13ac0`, `491651c` | `backend/tests/test_reservation_concurrency.py`, `backend/tests/models/test_reservation_constraints.py`, `backend/tests/services/test_reservation_service.py`, `backend/tests/api/test_reservations_api.py`, `backend/tests/test_migrations.py`, `frontend/src/pages/reservation.test.tsx`, `frontend/e2e/reservation.e2e.ts` | Coberto |
| **História 01 CA1** Somente domínio acadêmico válido | #15 | `64164d8`, `069c414` | `backend/tests/api/test_auth.py`, `backend/tests/core/test_config.py`, `frontend/e2e/auth.e2e.ts` | Coberto. Restrição configurável, ligada em produção |
| **História 01 CA2** Mensagem amigável de erro | #16, #36 | `64164d8`, `069c414`, `fb766a6` | `backend/tests/api/test_auth.py`, `frontend/src/pages/auth.test.tsx`, `frontend/src/lib/api/http-client.test.ts`, `frontend/e2e/auth.e2e.ts` | Coberto |
| **História 02 CA1** Impedir horários ocupados | #22, #23 | `ad1de9f`, `13d5ff0`, `8b13ac0`, `491651c` | `backend/tests/services/test_availability.py`, `backend/tests/services/test_reservation_service.py`, `frontend/src/pages/availability.test.tsx`, `frontend/src/domain/slot-selection.test.ts`, `frontend/src/pages/reservation.test.tsx`, `frontend/e2e/reservation.e2e.ts` | Coberto |
| **História 02 CA2** Resumo antes de confirmar | #23 | `491651c` | `frontend/src/pages/reservation.test.tsx`, `frontend/e2e/reservation.e2e.ts`, `frontend/e2e/keyboard.e2e.ts` | Coberto |
| **História 03 CA1** Confirmação explícita do cancelamento | #26 | `d4021d7` | `frontend/src/pages/my-reservations.test.tsx`, `frontend/e2e/reservation.e2e.ts` | Coberto |
| **História 03 CA2** Status volta para "Disponível" | #26, #31 | `797818a`, `d4021d7`, `fca3d53` | `backend/tests/services/test_cancellation.py`, `backend/tests/services/test_reservation_service.py`, `backend/tests/models/test_reservation_constraints.py`, `backend/tests/api/test_resource_search.py`, `frontend/src/pages/realtime.test.tsx`, `frontend/e2e/reservation.e2e.ts` | Coberto |
| **Épico #5** Administração do patrimônio | #27, #30, #50, #17 | `9bde022`, `2fe21fa`, `4c86503`, `a34ee8d`, `165d83f`, `5f762ca`, `347130a`, `64164d8`, `069c414`, `b59baea` | `backend/tests/api/test_admin_catalog.py`, `backend/tests/api/test_admin_reservations.py`, `backend/tests/api/test_admin_users.py`, `backend/tests/services/test_admin_seed.py`, `frontend/src/pages/admin-catalog.test.tsx`, `frontend/src/pages/admin-agenda.test.tsx`, `frontend/src/pages/AdminUsersPage.test.tsx`, `frontend/e2e/demo.e2e.ts` | Coberto. Sem E2E do cancelamento pela agenda |
| **#34** LGPD | #34, #49 | `62a1ce1`, `bd92810`, `ee9ea0d`, `c2de7d1`, `4aa0606` | `backend/tests/api/test_account.py`, `backend/tests/api/test_reservations_api.py`, `backend/tests/api/test_board.py`, `backend/tests/services/test_availability.py`, `backend/tests/services/test_admin_seed.py`, `backend/tests/api/test_process_time.py`, `frontend/src/pages/auth.test.tsx`, `frontend/src/pages/privacy.test.tsx`, `frontend/src/components/legal/CookieBanner.test.tsx`, `frontend/src/lib/analytics/analytics.test.ts` | Coberto |
| **#43** Check-in pelo QR da porta e liberação de quem não compareceu | #43 | `a666c83`, `a1918d9`, `fd4ddd2`, `31cdb5a`, `b59baea` | `backend/tests/services/test_checkin.py`, `backend/tests/api/test_checkin_api.py`, `backend/tests/test_migrations.py`, `frontend/src/domain/checkin.test.ts`, `frontend/src/pages/checkin.test.tsx`, `frontend/src/pages/admin-resource-qr.test.tsx`, `frontend/src/pages/my-reservations.test.tsx`, `frontend/e2e/checkin.e2e.ts`, `frontend/e2e/demo.e2e.ts` | Coberto |
| **#44** Painel de ocupação com exportação CSV | #44 | `4e9e0b2`, `21f51e0`, `31cdb5a` | `backend/tests/services/test_occupancy.py`, `backend/tests/api/test_admin_occupancy.py`, `frontend/src/pages/admin-occupancy.test.tsx`, `frontend/e2e/checkin.e2e.ts`, `frontend/e2e/accessibility.e2e.ts` | Coberto |

Mensagens dos commits citados:

| Commit | Mensagem |
|---|---|
| `628353a` | docs(modeling): add data model, dictionary and constraints (refs #13) |
| `52b3c3d` | feat(backend): scaffold FastAPI app with typed OOP layers, Alembic and Postgres test harness (closes #10) |
| `64164d8` | feat(auth): open signup, login with JWT, admin-created accounts and admin seed (refs #15 #16 #17) |
| `069c414` | feat(frontend): login, signup, session guards, account page and admin user management (closes #15, closes #16, closes #17) |
| `62e5276` | feat(catalog): add buildings, resources and features with idempotent seed and read endpoints (refs #20) |
| `ecaea6d` | feat(frontend): resource catalog list and detail pages (closes #20) |
| `e7b990b` | feat(catalog): add reservation table with overlap constraint and resource search filters (refs #21) |
| `a89b653` | feat(frontend): resource search filters synced to the URL with mobile drawer (closes #21) |
| `ad1de9f` | feat(availability): day slot grid per resource, weekly opening hours and public rules endpoint (refs #22) |
| `13d5ff0` | feat(frontend): availability grid with interval selection and opening hours from the API (closes #22) |
| `8b13ac0` | feat(reservations): create reservations with schedule validation, readable codes and race-safe conflict handling (refs #23) |
| `491651c` | feat(frontend): reservation summary dialog with one-click confirmation and conflict recovery (closes #23) |
| `c2de7d1` | feat(board): daily occupancy board for all resources with LGPD-safe holders (refs #51) |
| `cd4636f` | feat(frontend): schedule board page with desktop table and mobile list (closes #51) |
| `ee9ea0d` | feat(reservations): public receipt verification with first name only and rate limit (refs #24) |
| `459355e` | feat(frontend): reservation receipt page with QR code, print and copy link (closes #24) |
| `a41aa35` | feat(reservations): list my upcoming and past reservations with cancellation permission (refs #25) |
| `797818a` | feat(reservations): cancel own reservation up to 30 minutes before start (refs #26) |
| `d4021d7` | feat(frontend): dashboard, my reservations tabs and confirmed cancellation flow (closes #25, closes #26) |
| `f4bd1b2` | feat(reservations): configurable max duration, advance window and active reservations per role (refs #28) |
| `e4a4a72` | fix(frontend): block double submit in reservation and cancellation dialogs |
| `afae52c` | feat(frontend): enforce max duration, advance window and active limit before calling the API (closes #28) |
| `f63d059` | fix(frontend): fall back to default rules on older APIs and compact the mobile summary bar |
| `9bde022` | feat(admin): manage buildings, resources and features with safe deactivation (refs #27) |
| `2fe21fa` | feat(frontend): admin screens for resources, buildings and features (closes #27) |
| `4c86503` | test(frontend): scope board link query to main content and reset matchMedia emulation (refs #27) |
| `5f762ca` | feat(admin): change role and deactivate existing accounts (refs #50) |
| `347130a` | feat(frontend): edit role and status of existing accounts (closes #50) |
| `a34ee8d` | feat(admin): daily agenda and administrative cancellation with reason (refs #30) |
| `165d83f` | feat(frontend): admin daily agenda with reasoned cancellation (closes #30) |
| `62a1ce1` | feat(lgpd): mandatory terms acceptance, data export and account deletion (refs #34) |
| `bd92810` | feat(frontend): privacy notice, terms, consent at signup and self-service data rights (closes #34) |
| `4634bdd` | perf(reservations): GiST overlap queries, volume seed, timing middleware and load test (refs #33) |
| `fca3d53` | feat(frontend): refresh availability, search, board and agenda every 10s while visible (closes #31) |
| `fb766a6` | feat(frontend): friendly offline state on first failure and in-layout error page (closes #36) |
| `5bf3109` | fix(frontend): keep search filters changed in quick succession |
| `ba3f450` | test(e2e): playwright main flow on desktop and Pixel 7 with isolated database and CI job (closes #35) |
| `6a72cf8` | fix(frontend): 44px touch targets and no layout shift on the mobile search (refs #32) |
| `5886a26` | perf(frontend): drop axios and date pickers, lazy reservation dialog, preload page chunk and critical fonts (refs #32) |
| `5207290` | test(e2e): responsive and WCAG 2.2 audit, keyboard-only flow and Lighthouse script with report (refs #32) |
| `4aa0606` | feat(frontend): GA4 with consent mode, cookie banner and privacy-safe product events (refs #49) |
| `a666c83` | feat(checkin): door QR check-in and automatic no-show release with configurable window (refs #43) |
| `a1918d9` | feat(frontend): door QR check-in page, printable door poster and check-in status across reservations (closes #43) |
| `fd4ddd2` | fix(checkin): find reservations whose window opens before midnight (refs #43) |
| `4e9e0b2` | feat(occupancy): admin occupancy analytics with heatmap, attendance, returned hours and CSV export (refs #44) |
| `21f51e0` | feat(frontend): occupancy dashboard with validated heatmap ramp, rankings, period presets and CSV download (closes #44) |
| `31cdb5a` | test(e2e): door QR check-in, door poster and occupancy dashboard in the browser and accessibility audit (refs #43 #44) |
| `b59baea` | test(e2e): presentation script end to end with two browsers and a recordable plan B video (refs #38) |

## Detalhe por requisito

Nos testes do back, o nome é a função pytest. Nos do front e do E2E, o nome é o texto do `it` ou
do `test`.

### RF01: cadastro e autenticação via e-mail institucional

O cadastro aceita qualquer domínio por padrão e restringe quando `ALLOWED_EMAIL_DOMAINS` está
preenchido (decisão de 13/10/2026, ADR 0001 seção 9). O `render.yaml` liga a restrição com
`umj.edu.br` em produção, e o E2E roda com a mesma configuração.

| Teste | Nome |
|---|---|
| `backend/tests/api/test_auth.py` | `TestSignup::test_creates_student_account_with_any_email`, `test_password_is_stored_hashed`, `test_cannot_choose_own_role`, `test_duplicate_email_ignores_case`, `test_duplicate_registration_number`, `test_rejects_invalid_data`, `test_domain_restriction_when_configured` |
| `backend/tests/api/test_auth.py` | `TestLogin::test_returns_token_and_user`, `test_same_message_for_wrong_password_or_unknown_email`, `test_inactive_account` |
| `backend/tests/api/test_auth.py` | `TestMe::test_returns_logged_user`, `test_requires_token`, `test_rejects_tampered_token`, `test_rejects_token_of_deactivated_user`, `test_rejects_expired_token`; e `test_login_is_rate_limited`, `test_roles_are_exposed_in_openapi` |
| `backend/tests/core/test_security.py` | `test_hasher_verifies_only_the_right_password`, `test_token_round_trip`, `test_token_expires`, `test_rejects_invalid_tokens` |
| `backend/tests/core/test_config.py` | `test_empty_domain_list_means_open_signup`, `test_requires_strong_jwt_secret` |
| `frontend/src/pages/auth.test.tsx` | "signs in and returns to the page the visitor wanted", "creates the account, signs in and opens the dashboard", "sends visitors of private pages to the login", "ends an expired session and asks to sign in again", "shows account data and signs out" |
| `frontend/e2e/auth.e2e.ts` | "recusa e-mail inválido e cria a conta com o e-mail institucional", "avisa sobre a senha errada e entra com a correta" |

### RF02: busca e visualização por data, horário e recursos disponíveis

| Teste | Nome |
|---|---|
| `backend/tests/api/test_catalog.py` | `test_lists_only_active_resources_with_building_and_features`, `test_detail_returns_resource`, `test_detail_hides_inactive_resources`, `test_lists_active_buildings_and_all_features` |
| `backend/tests/api/test_resource_search.py` | `test_filters_by_building`, `test_filters_by_type`, `test_requires_every_selected_feature`, `test_filters_by_minimum_capacity`, `test_searches_by_name`, `test_combines_filters_like_the_user_journey`, `test_hides_resources_with_overlapping_reservations`, `test_cancelled_reservations_free_the_slot`, `test_rejects_intervals_in_the_past` |
| `backend/tests/services/test_availability.py` | `test_free_weekday_has_thirty_minute_slots_within_opening_hours`, `test_saturday_has_shorter_hours_and_sunday_is_closed`, `test_slots_that_already_started_today_are_past`, `test_whole_past_day_is_past` |
| `backend/tests/api/test_availability_api.py` | `test_returns_the_day_grid`, `test_rules_are_public_and_list_the_opening_hours` |
| `backend/tests/api/test_board.py` | `test_filters_by_building_and_type`, `test_closed_day_is_empty` |
| `frontend/src/pages/resource-search.test.tsx` | "applies the filters from the URL, converting the time window to UTC", "writes each change to the URL and searches again from page 1", "keeps a filter picked while the typed name is still waiting to be applied" |
| `frontend/src/pages/availability.test.tsx` | "shows each state with text, not only color", "moves between days through the URL", "explains when the campus is closed" |
| `frontend/src/pages/board.test.tsx` | "shows what is taken in every resource, with text and not only color", "links free time to the resource grid with the slot preselected" |
| `frontend/src/pages/realtime.test.tsx` | "shows a reservation made elsewhere without reloading", "asks nothing while the tab is hidden and catches up when it comes back" |
| `frontend/e2e/reservation.e2e.ts` | "busca sala com projetor, reserva pela grade e recebe o comprovante" |

### RF03: realização e confirmação de reservas em tempo real

Inclui o comprovante digital (jornada, passo 5) e as regras de uso da #28.

| Teste | Nome |
|---|---|
| `backend/tests/services/test_reservation_service.py` | `test_creates_a_confirmed_reservation_with_a_readable_code`, `test_rejects_intervals_outside_the_rules`, `test_participants_cannot_exceed_capacity_but_equipment_has_none`, `test_inactive_resource_is_not_found`, `test_retries_when_the_code_already_exists`, `test_only_owner_and_admin_see_a_reservation` |
| `backend/tests/api/test_reservations_api.py` | `test_creates_and_reads_back_a_reservation`, `test_rejects_invalid_payloads`, `test_inverted_interval_is_422`, `test_public_receipt_shows_only_the_minimum`, `test_receipt_of_a_cancelled_reservation_says_so`, `test_my_reservations_only_lists_my_own` |
| `backend/tests/services/test_usage_rules.py` | `test_duration_up_to_four_hours`, `test_advance_up_to_fourteen_days`, `test_active_reservations_limit_per_role`, `test_admin_has_no_active_limit`, `test_cancelled_and_finished_reservations_free_the_quota` |
| `backend/tests/services/test_my_reservations.py` | `test_splits_upcoming_and_history`, `test_page_carries_the_permission` |
| `frontend/src/pages/reservation.test.tsx` | "shows the summary and confirms with one click", "checks the participants against the capacity before sending", "blocks a second click while confirming" |
| `frontend/src/pages/receipt.test.tsx` | "works without login and shows status, code, details and the QR code", "makes a cancelled reservation impossible to miss", "prints and copies the verification link" |
| `frontend/src/pages/my-reservations.test.tsx` | "lists upcoming reservations with status and actions", "greets the user and shows the next reservation" |
| `frontend/src/pages/usage-rules.test.tsx` | "does not let the selection go past the maximum duration", "stops at the last bookable day", "explains the active reservations limit instead of offering to reserve" |
| `frontend/src/pages/realtime.test.tsx` | "shows a reservation made elsewhere without reloading" (a grade é refeita a cada 10 s; o critério da #31 é 15 s) |
| `frontend/e2e/reservation.e2e.ts` | "busca sala com projetor, reserva pela grade e recebe o comprovante" |

### RF04: cancelamento com no mínimo 30 minutos de antecedência

O relógio do servidor decide (`Clock` injetado). Os testes usam relógio fixo.

| Teste | Nome |
|---|---|
| `backend/tests/services/test_cancellation.py` | `test_owner_cancels_with_31_minutes_and_slot_is_free_again`, `test_owner_cannot_cancel_with_29_minutes`, `test_only_the_owner_cancels_here_and_admin_owns_no_deadline`, `test_cancelling_twice_is_a_conflict`, `test_errors_have_stable_codes` |
| `backend/tests/services/test_my_reservations.py` | `test_can_cancel_up_to_thirty_minutes_before`, `test_cancelled_reservation_cannot_be_cancelled_again` |
| `backend/tests/api/test_reservations_api.py` | `test_cancel_endpoint` |
| `frontend/src/pages/my-reservations.test.tsx` | "explains why a reservation can no longer be cancelled", "cancels, confirms and refreshes the list", "shows the server reason when the deadline passed meanwhile" |
| `frontend/e2e/reservation.e2e.ts` | "cancela em Minhas reservas e o horário volta a ficar livre" |

### RNF01: interface totalmente responsiva

Evidência extra: [`docs/qualidade/acessibilidade-e-responsividade.md`](qualidade/acessibilidade-e-responsividade.md).
23 telas e estados sem rolagem horizontal em 360, 390, 768 e 1366 px, alvos de toque de 44 px no
celular, zero violações WCAG 2.2 AA no axe-core e fluxo completo só com teclado.

| Teste | Nome |
|---|---|
| `frontend/e2e/accessibility.e2e.ts` | Grupo "responsividade e acessibilidade (#32)", um teste por tela auditada |
| `frontend/e2e/mobile.e2e.ts` | "reserva e cancela pelo celular, sem rolagem horizontal" |
| `frontend/e2e/keyboard.e2e.ts` | "reserva, confere e cancela usando só o teclado" |
| `frontend/e2e/public.e2e.ts` | "CTA de entrada visível sem rolar em 360px" e "em 1280px" |
| `frontend/src/layouts/AppLayout.test.tsx` | "offers the desktop side navigation with the current page marked", "offers the four mobile destinations" |
| `frontend/src/pages/admin-catalog.test.tsx` | "stacks resources as a list on small screens" |

**Pendência:** o critério da #32 pede Lighthouse mobile com Performance de 80 ou mais. Na
medição local, o login chegou a 81, mas a busca ficou em 72 e a grade em 68 (Acessibilidade 100
nas três). O relatório explica a causa e mede o ganho de servir a API pelo mesmo domínio do front.
A medição em produção depende da #19. A #32 segue aberta.

### RNF02: consultas de disponibilidade em até 2 segundos

Evidência extra: [`docs/qualidade/performance.md`](qualidade/performance.md). Com 19.557 reservas
e 30 usuários simultâneos, o p95 local foi de 45 ms na busca e na disponibilidade e de 85 ms no
quadro, com `EXPLAIN ANALYZE` anexado.

| Teste | Nome |
|---|---|
| `backend/tests/api/test_board.py` | `test_uses_a_fixed_number_of_queries` (sem N+1 no quadro) |
| `backend/tests/api/test_process_time.py` | `test_every_response_has_the_process_time_header`, `test_slow_requests_are_logged_without_query_string` |
| `backend/tests/services/test_volume_seed.py` | `test_fills_resources_users_and_non_overlapping_reservations` (massa da medição) |
| `backend/tests/load/locustfile.py` | Script de carga do Locust. Roda à mão, fora do CI |

**Pendência:** o critério da #33 pede o p95 medido na API de produção. Essa medição ainda não foi
feita, porque depende do deploy (#19). Não há teste automatizado que falhe se uma consulta passar
de 2 segundos; o limite é verificado pela medição de carga.

### RNF03: integridade, sem reservas sobrepostas

A decisão e o raciocínio estão em [arquitetura.md](arquitetura.md#decisão-exclusion-constraint-para-o-rnf03).

| Teste | Nome |
|---|---|
| `backend/tests/test_reservation_concurrency.py` | `test_two_simultaneous_requests_give_one_reservation_and_one_conflict` |
| `backend/tests/models/test_reservation_constraints.py` | `test_rejects_overlapping_confirmed_reservations`, `test_allows_back_to_back_reservations`, `test_cancelled_reservations_do_not_block`, `test_rejects_inverted_intervals` |
| `backend/tests/services/test_reservation_service.py` | `test_overlap_rules`, `test_cancelled_reservation_does_not_block`, `test_the_database_constraint_wins_a_race` |
| `backend/tests/api/test_reservations_api.py` | `test_overlap_is_409_with_a_friendly_message` |
| `backend/tests/test_migrations.py` | `test_head_enables_btree_gist`, `test_migrations_are_reversible` |
| `frontend/src/pages/reservation.test.tsx` | "on conflict, warns, refreshes the grid and keeps the user on the page" |
| `frontend/e2e/reservation.e2e.ts` | "avisa quando o horário é tomado antes da confirmação e atualiza a grade" |

### História 01

**CA1, somente domínio acadêmico válido.** Mesma ressalva do RF01: a restrição depende de
`ALLOWED_EMAIL_DOMAINS`, que está preenchido em produção e no E2E.

| Teste | Nome |
|---|---|
| `backend/tests/api/test_auth.py` | `TestSignup::test_domain_restriction_when_configured` |
| `backend/tests/core/test_config.py` | `test_comma_separated_lists_are_split_and_normalized`, `test_empty_domain_list_means_open_signup` |
| `frontend/e2e/auth.e2e.ts` | "recusa e-mail inválido e cria a conta com o e-mail institucional" (o `gmail.com` é recusado pela API) |

**CA2, mensagem amigável de erro.**

| Teste | Nome |
|---|---|
| `backend/tests/api/test_auth.py` | `TestLogin::test_same_message_for_wrong_password_or_unknown_email` |
| `frontend/src/pages/auth.test.tsx` | "shows the friendly server message on wrong credentials", "validates before calling the API", "points a duplicated e-mail to the e-mail field", "checks password rules and confirmation", "offers a retry when the API is unreachable" |
| `frontend/src/lib/api/http-client.test.ts` | "turns domain errors into ApiError with detail and code", "maps validation errors to field errors", "uses a friendly message for server failures without the standard body" |
| `frontend/e2e/auth.e2e.ts` | "avisa sobre a senha errada e entra com a correta" |

### História 02

**CA1, impedir horários ocupados.** A grade mostra o horário ocupado e não deixa selecioná-lo; se
ele for tomado com o resumo aberto, a API recusa (RNF03).

| Teste | Nome |
|---|---|
| `backend/tests/services/test_availability.py` | `test_reserved_slots_are_busy_without_exposing_the_holder_to_students` |
| `backend/tests/services/test_reservation_service.py` | `test_overlap_rules` |
| `frontend/src/pages/availability.test.tsx` | "never selects across an occupied slot" |
| `frontend/src/domain/slot-selection.test.ts` | "ignores busy slots and never crosses them" |
| `frontend/src/pages/reservation.test.tsx` | "on conflict, warns, refreshes the grid and keeps the user on the page" |
| `frontend/e2e/reservation.e2e.ts` | "avisa quando o horário é tomado antes da confirmação e atualiza a grade" |

**CA2, resumo antes de confirmar.**

| Teste | Nome |
|---|---|
| `frontend/src/pages/reservation.test.tsx` | "shows the summary and confirms with one click", "closes without reserving" |
| `frontend/e2e/reservation.e2e.ts` | "busca sala com projetor, reserva pela grade e recebe o comprovante" |
| `frontend/e2e/keyboard.e2e.ts` | "reserva, confere e cancela usando só o teclado" |

### História 03

**CA1, confirmação explícita.**

| Teste | Nome |
|---|---|
| `frontend/src/pages/my-reservations.test.tsx` | "always asks first and keeping the reservation sends nothing", "cancels, confirms and refreshes the list" |
| `frontend/e2e/reservation.e2e.ts` | "cancela em Minhas reservas e o horário volta a ficar livre" |

**CA2, status volta para "Disponível".**

| Teste | Nome |
|---|---|
| `backend/tests/services/test_cancellation.py` | `test_owner_cancels_with_31_minutes_and_slot_is_free_again` |
| `backend/tests/services/test_reservation_service.py` | `test_cancelled_reservation_does_not_block` |
| `backend/tests/models/test_reservation_constraints.py` | `test_cancelled_reservations_do_not_block` |
| `backend/tests/api/test_resource_search.py` | `test_cancelled_reservations_free_the_slot` |
| `frontend/src/pages/realtime.test.tsx` | "frees the slot when it is cancelled elsewhere" |
| `frontend/e2e/reservation.e2e.ts` | "cancela em Minhas reservas e o horário volta a ficar livre" |

### Épico #5: administração do patrimônio

Catálogo (#27, regras no [ADR 0002](adr/0002-exclusao-de-blocos-e-recursos.md)), agenda do dia
com cancelamento administrativo (#30), contas (#17 e #50).

| Teste | Nome |
|---|---|
| `backend/tests/api/test_admin_catalog.py` | `test_created_room_shows_up_in_student_search`, `test_name_is_unique_per_building_ignoring_case`, `test_resource_without_history_is_deleted`, `test_resource_with_history_is_deactivated_and_history_stays`, `test_deactivation_with_future_reservations_needs_confirmation`, `test_building_with_resources_is_deactivated_cancelling_future_reservations`, `test_feature_crud_detaches_from_resources`, `test_non_admins_get_403_everywhere` |
| `backend/tests/api/test_admin_reservations.py` | `test_agenda_lists_the_whole_day_grouped_with_holder`, `test_agenda_filters_by_building_resource_and_status`, `test_admin_cancels_with_reason_and_owner_sees_it`, `test_reason_is_required`, `test_cannot_cancel_ended_cancelled_or_missing_reservations`, `test_non_admins_get_403` |
| `backend/tests/api/test_admin_users.py` | `test_admin_creates_account_with_chosen_role`, `test_promotion_applies_on_next_request`, `test_deactivated_account_loses_session_and_cannot_log_in`, `test_deactivation_cancels_only_future_reservations`, `test_admin_cannot_lock_themselves_out`, `test_students_cannot_manage_users` |
| `backend/tests/services/test_admin_seed.py` | `test_creates_admin`, `test_is_idempotent_and_keeps_password`, `test_promotes_existing_account` |
| `frontend/src/pages/admin-catalog.test.tsx` | "creates a resource that the list shows right away", "asks before cancelling future reservations when removing", "reports when a resource without history is deleted", "reactivates a deactivated resource", "blocks non-admin users" |
| `frontend/src/pages/admin-agenda.test.tsx` | "groups the day reservations by resource with who booked", "cancels with a mandatory reason and refreshes the agenda", "blocks non-admin users" |
| `frontend/src/pages/AdminUsersPage.test.tsx` | "creates an account with the chosen role", "changes the role of an existing account", "asks for confirmation before deactivating an account" |
| `frontend/src/pages/my-reservations.test.tsx` | "shows the reason when the administration cancelled the reservation" |

| `frontend/e2e/demo.e2e.ts` | "roteiro da apresentação: reserva, conflito, check-in, cancelamento e administração" (cadastra uma sala pela tela de administração e confere que ela aparece na busca) |

**Lacuna:** o cancelamento administrativo pela agenda não tem teste E2E no navegador. Essa parte
é coberta só por testes de API e de componente.

### #34: LGPD

Evidência extra: [`docs/lgpd/revisao-endpoints.md`](lgpd/revisao-endpoints.md), revisão de todos
os endpoints quanto aos dados pessoais expostos (critério da #34).

| Teste | Nome |
|---|---|
| `backend/tests/api/test_account.py` | `test_signup_is_impossible_without_acceptance`, `test_signup_records_acceptance_date`, `test_admin_created_account_accepts_on_first_access`, `test_export_has_account_and_every_reservation`, `test_deletion_anonymizes_and_keeps_history_without_identity`, `test_deletion_requires_the_current_password`, `test_admin_cannot_delete_own_account` |
| `backend/tests/api/test_reservations_api.py` | `test_public_receipt_shows_only_the_minimum` |
| `backend/tests/api/test_board.py` | `test_everyone_sees_what_is_taken_without_names` |
| `backend/tests/services/test_availability.py` | `test_reserved_slots_are_busy_without_exposing_the_holder_to_students` |
| `backend/tests/services/test_admin_seed.py` | `test_seed_log_masks_the_email` |
| `backend/tests/api/test_process_time.py` | `test_slow_requests_are_logged_without_query_string` |
| `frontend/src/pages/auth.test.tsx` | "does not create the account without accepting the privacy notice" |
| `frontend/src/pages/privacy.test.tsx` | "shows the privacy notice to visitors, with rights and retention", "asks for acceptance before opening the app", "downloads every stored data as a JSON file", "deletes the account and ends the session" |
| `frontend/src/components/legal/CookieBanner.test.tsx` | "asks on the first visit, with accept and decline side by side and the privacy notice", "starts measuring only after accept and remembers the choice" |
| `frontend/src/lib/analytics/analytics.test.ts` | "loads nothing and sends nothing before consent", "stops measuring and deletes the _ga cookies when consent is withdrawn" |

### #43: check-in pelo QR da porta

Cada recurso tem um token de check-in (o QR fixado na porta). A janela abre
`CHECKIN_ANTECEDENCIA_MIN` antes do início e fecha `CHECKIN_TOLERANCIA_MIN` depois; sem check-in,
a reserva vira `NAO_COMPARECEU` na primeira requisição seguinte e o horário volta a ficar livre.
Tolerância zero desliga a liberação.

| Teste | Nome |
|---|---|
| `backend/tests/services/test_checkin.py` | `test_window_goes_from_lead_before_start_to_tolerance_after`, `test_check_in_is_accepted_at_both_ends_of_the_window`, `test_too_early_is_rejected_with_the_local_opening_time`, `test_after_the_deadline_the_reservation_is_released_and_check_in_is_a_conflict`, `test_nobody_checks_in_on_someone_elses_reservation`, `test_unknown_token_or_inactive_resource_is_an_invalid_qr_code`, `test_releases_every_confirmed_reservation_without_check_in_after_the_tolerance`, `test_zero_tolerance_turns_the_release_off`, `test_released_time_is_free_again_and_can_be_booked_for_the_rest_of_the_slot`, `test_window_that_opens_the_day_before_finds_the_midnight_reservation` |
| `backend/tests/api/test_checkin_api.py` | `test_check_in_requires_login`, `test_reads_the_qr_code_checks_in_and_reads_again`, `test_after_the_tolerance_the_reservation_is_released`, `test_released_time_shows_free_on_the_grid_and_in_the_admin_agenda`, `test_admin_sees_and_renews_the_qr_code_token`, `test_resources_get_distinct_tokens` |
| `frontend/src/pages/checkin.test.tsx` | "confirms presence with one tap when the window is open", "tells when the check-in opens when the person arrives early", "explains a reservation released for lack of check-in and offers to book again", "says the QR was not recognized for an old or wrong code", "asks a visitor to sign in and comes back to the QR page" |
| `frontend/src/pages/admin-resource-qr.test.tsx` | "shows a printable poster with the check-in QR and its link", "replaces the QR after confirmation, invalidating the printed one", "is only for the administration" |
| `frontend/e2e/checkin.e2e.ts` | "confirma presença pelo QR da porta e a lista mostra o check-in", "QR antigo ou inventado não confirma nada" |
| `frontend/e2e/demo.e2e.ts` | "roteiro da apresentação: reserva, conflito, check-in, cancelamento e administração" |

### #44: painel de ocupação

| Teste | Nome |
|---|---|
| `backend/tests/services/test_occupancy.py` | `test_summary_counts_only_confirmed_hours_inside_period_and_opening`, `test_heatmap_splits_reservations_by_local_hour_and_skips_closed_hours`, `test_heatmap_counts_only_open_minutes_of_a_partial_hour`, `test_building_filter_keeps_only_its_resources`, `test_returned_hours_are_clipped_to_the_period`, `test_attendance_rate_is_null_without_checkins_or_no_shows`, `test_invalid_period_is_rejected` |
| `backend/tests/api/test_admin_occupancy.py` | `test_only_admins`, `test_releases_no_shows_before_computing`, `test_csv_opens_in_excel_pt_br`, `test_invalid_period_is_a_friendly_error` |
| `frontend/src/pages/admin-occupancy.test.tsx` | "leads with occupancy, attendance, returned hours and cancellations", "writes the rate inside every heatmap cell and explains the colors", "ranks the most and the least used spaces", "downloads the CSV with the BOM Excel needs", "is only for the administration" |
| `frontend/e2e/checkin.e2e.ts` | "a administração imprime o QR da porta e acompanha a ocupação" |
| `frontend/e2e/accessibility.e2e.ts` | auditoria WCAG 2.2 de "admin: ocupação" |

## Requisitos sem evidência completa

| Requisito | O que falta |
|---|---|
| RNF02 | Medição do p95 na API de produção (critério da #33). Existe só a medição local |
| RNF01 | Lighthouse mobile com Performance de 80 ou mais na busca (72) e na grade (68), critério da #32. Medição em produção pendente |
| Épico #5 | Teste E2E do cancelamento administrativo pela agenda |
| Todos | Conferência no ambiente publicado, que depende de o deploy da #19 ir ao ar |
