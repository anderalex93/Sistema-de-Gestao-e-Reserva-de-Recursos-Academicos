# Apresentação do MVP (20/11)

Issue #38. Roteiro da demonstração, preparação, plano B e checklist do dia. A demo segue a
jornada da persona do relatório: **Lucas**, aluno, que reserva uma sala pelo celular antes da aula.

O roteiro inteiro é executado por um teste automático, [`frontend/e2e/demo.e2e.ts`](../../frontend/e2e/demo.e2e.ts),
com dois navegadores, a cada push na `main`. Se o teste está verde, cada passo abaixo funciona.

## Contas de demonstração

Criadas pelo seed de demonstração: `make seed-demo` no back, ou `SEED_DEMO=true` no Render e no
`docker compose up`, que refazem o cenário a cada subida. A senha das três vem de `SEED_DEMO_SENHA`
(no Docker local: `Demo2026`).

| Conta | Perfil | Para quê |
|---|---|---|
| `aluno.demo@umj.edu.br` | Aluno (Lucas Andrade) | Fluxo principal no navegador A e no celular |
| `prof.demo@umj.edu.br` | Professora (Marina Lopes) | Navegador B: tenta o mesmo horário e vê o horário voltar |
| `admin.demo@umj.edu.br` | Administração | Sala nova, QR da porta, agenda e painel de ocupação |

O seed cria quatro semanas de histórico com padrão realista (picos à tarde e à noite), o dia de
hoje com várias salas ocupadas, duas reservas futuras do Lucas (amanhã e depois) e uma reserva de
outra pessoa no **Laboratório Maker** que começou sem check-in: na primeira consulta depois de 15
minutos, ela vira "Não compareceu" e a sala volta a ficar livre.

A **Sala de estudo 203 do Bloco B** (com projetor) fica livre o dia todo para a demo.

## Montagem do palco

| Tela | O que fica aberto |
|---|---|
| Projetor, navegador A | `aluno.demo`, na página Reservar |
| Projetor, navegador B (outra janela, anônima) | `prof.demo`, na grade de hoje da Sala de estudo 203 do Bloco B |
| Celular de quem apresenta | `aluno.demo` logado, câmera pronta para ler QR |
| Folha A4 (ou aba) | QR da porta da Sala de estudo 203 do Bloco B (Administração > Recursos > QR da porta) |
| Navegador C (aba) | `admin.demo`, na Administração |

## Roteiro (7 minutos)

| Tempo | Passo | O que fazer e mostrar | Requisito |
|---|---|---|---|
| 0:00 | **Problema** | "Hoje é papel e planilha: sala reservada duas vezes e sala reservada vazia." | Contexto |
| 0:30 | **Cadastro** | Criar conta com `@gmail.com`: o sistema recusa. Com `@umj.edu.br`: conta pronta na hora | RF01, História 01 |
| 1:00 | **Busca** | A: Reservar > Tipo Sala de estudo + Projetor + hoje, no próximo horário. Só aparece o que está livre | RF02 |
| 1:30 | **Resumo aberto em B** | B: na grade da Sala 203, tocar no mesmo horário e abrir o resumo, sem confirmar | Preparação do conflito |
| 1:45 | **Reserva** | A: abrir a Sala 203, escolher o horário, ver o resumo e confirmar. Comprovante com QR: ler com o celular e mostrar a conferência sem login | RF03, História 02 CA2 |
| 2:30 | **Conflito ao vivo** | B: confirmar o resumo aberto: "Este horário acabou de ser reservado por outra pessoa" e a grade se atualiza | RNF03, História 02 CA1 |
| 3:00 | **Check-in pela porta** | Celular lê o QR da porta da Sala 203: "Presença confirmada". Explicar: sem check-in em 15 minutos, a sala é liberada | Inovação |
| 3:45 | **Sala devolvida** | C: Agenda do dia: a reserva do Laboratório Maker aparece como "Não compareceu", liberada às HH:MM. No Quadro, o horário está livre | Inovação |
| 4:15 | **Cancelamento** | B: abrir a grade de amanhã da sala da reserva de amanhã do Lucas. A: Minhas reservas > Cancelar > "Sim, cancelar". Em até 10 s o horário fica livre em B, sem recarregar | RF04, História 03 |
| 5:00 | **Administração** | C: cadastrar uma sala nova e mostrar na busca. Painel de ocupação: mapa de calor da semana, comparecimento e horas devolvidas; baixar o CSV | Épico #5 |
| 6:00 | **Bastidores** | Arquitetura, exclusion constraint no PostgreSQL, CI com E2E deste roteiro, RNF02 medido (p95 de 45 ms), Lighthouse e WCAG 2.2 | RNF01 a RNF03 |
| 7:00 | Fim | Próximos passos (e-mail, recorrência, SSO) e perguntas | |

O cancelamento usa a reserva de amanhã porque a reserva feita ao vivo começa em menos de 30
minutos, e o RF04 só permite cancelar até 30 minutos antes do início.

## Preparação

### Até 18/11 (code freeze)

- [ ] Deploy de produção no ar (docs/deploy.md) com `SEED_DEMO=true` e `SEED_DEMO_SENHA`.
- [ ] Workflow E2E verde na `main` (inclui o roteiro, `e2e/demo.e2e.ts`).
- [ ] Vídeo do plano B gravado contra produção (ver abaixo).
- [ ] QR da porta da Sala de estudo 203 do Bloco B impresso em A4.
- [ ] Dois ensaios cronometrados; definir quem fala em cada passo.

### No dia, 30 minutos antes

- [ ] Abrir `https://<api>/api/v1/health` para acordar a API do Render (o plano gratuito dorme e
      leva cerca de 50 s para voltar).
- [ ] Reiniciar o serviço da API no Render: o seed de demonstração refaz o cenário de hoje.
- [ ] Entrar nas três contas nos navegadores e no celular.
- [ ] Conferir o hotspot do celular como internet reserva.

## Vídeo do plano B

```bash
cd frontend
npm run demo:video                     # ambiente local do E2E (sobe API e front sozinho)
DEMO_BASE_URL=https://<site> DEMO_API_URL=https://<api>/api/v1 DEMO_SENHA=<senha> npm run demo:video
```

Grava `demo-video/1-aluno-lucas.webm`, `2-professora-marina.webm` e `3-administracao.webm`, um
por navegador, no ritmo de quem apresenta. Contra a produção, usa as contas de demonstração.

## Plano B

| Se falhar | Fazer |
|---|---|
| Internet ou Render | `docker compose up --build` no notebook (seed de demonstração incluído, senha `Demo2026`) e seguir o mesmo roteiro em `http://localhost:8080` |
| Projetor ou notebook | Os vídeos gravados da demo completa |
| Câmera do celular não lê o QR | Digitar o link que aparece embaixo do QR no cartaz |
| API acordando devagar | Começar pelos slides de problema e persona enquanto a API sobe |
