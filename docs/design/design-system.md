# Design system do EduSpace

Referência visual e de interação para todas as telas. Implementado como tema do MUI em
`frontend/src/theme/` (issue #11) e usado nos wireframes (issue #14).

## 1. Direção

**Editorial institucional.** O EduSpace tem cara de publicação acadêmica bem diagramada:
papel azulado claro, tinta azul-marinho, o azul institucional da UMJ como cor principal, tipografia com
serifa nos títulos e uma fonte de interface feita para legibilidade. A hierarquia vem de
tipografia, espaço e linhas finas. Nada de enfeite.

Princípios:

1. **O produto é a vitrine.** A grade de horários e o comprovante são as peças visuais mais
   importantes. Tudo o mais sai do caminho.
2. **Linha antes de sombra.** Separação por fios de 1px e mudança de fundo. Nenhuma sombra.
3. **Uma cor de ação.** O azul UMJ é a única cor que chama para clicar. Cores de status aparecem
   só quando comunicam estado.
4. **Estado nunca depende só de cor.** Livre, ocupado, selecionado e passado têm texto, ícone ou
   textura além da cor.
5. **Rápido e calmo.** Sem animação decorativa. Movimento só quando explica uma mudança.

## 2. Proibido (anti "vibecoded")

| Não usar | Usar no lugar |
|---|---|
| Gradientes, orbes radiais, grades de pontinhos | Fundos sólidos de papel |
| Fundo branco puro `#FFFFFF` | Papel `#F5F7FA` e superfície `#FCFDFE` |
| Cores arco-íris, neon, pastel básico, roxo com preto | Paleta da seção 3: cores oficiais da UMJ, um azul de ação e o ciano só como detalhe de marca |
| Sombras (`box-shadow`) | Borda de 1px e contraste de fundo |
| Cantos arredondados suaves | Raio de 2px em controles e 0 em tabelas e painéis |
| Ícones Lucide, ícones de brilho ou estrelinha, emojis | Material Symbols **Sharp** (`@mui/icons-material`, variantes `*Sharp`) |
| Inter, Geist, Space Grotesk | Literata, Atkinson Hyperlegible Next, Atkinson Hyperlegible Mono |
| "Liquid glass", `backdrop-filter`, translucidez | Superfícies opacas |
| Animações de hover, setas animadas | Troca imediata de cor no hover, sem transição |
| Três cards de funcionalidades em fileira, bento grid, card dentro de card | Listas numeradas, tabelas e seções com fio divisório |
| Faixa colorida na lateral esquerda de cards ou alertas | Ícone de status + texto no início da linha |
| Marcadores com checkmark | Listas numeradas ou com marcador simples |
| Janela de terminal, depoimentos inventados, três planos de preço | Captura real do produto funcionando |
| Travessão (o traço longo) e a construção "não é X, é Y" nos textos | Frases curtas e diretas, com vírgula ou ponto |

## 3. Cores

Paleta da marca UMJ, a partir dos tokens oficiais do `kode-design-kit` da Pro-Tech
(`brands/umj`), adaptada às regras da seção 2. Contrastes medidos contra o papel `#F5F7FA`
(WCAG 2.2).

| Token | Hex | Origem | Uso | Contraste |
|---|---|---|---|---|
| `paper` | `#F5F7FA` | UMJ background | Fundo da aplicação | |
| `surface` | `#FCFDFE` | derivado | Painéis, diálogos, campos (o kit usa branco puro, proibido aqui) | |
| `sunken` | `#E6E9EF` | UMJ muted | Áreas rebaixadas, cabeçalho de tabela, horário passado | |
| `hatch` | `#D5DBE4` | derivado | Textura de "ocupado" | ink 12,1:1 |
| `ink` | `#041C40` | UMJ foreground | Texto principal | 15,7:1 |
| `ink-muted` | `#596370` | UMJ muted-foreground | Texto secundário, legendas | 5,7:1 |
| `ink-disabled` | `#83929B` | UMJ muted-foreground (escuro) | Texto desabilitado (só junto de outro indicador) | 3,0:1 |
| `line` | `#D5DBE4` | derivado | Divisórias (a borda `#E6E9EF` do kit some sobre o papel) | |
| `line-strong` | `#7A8794` | derivado | Borda de campo e contorno de controles (a do kit dá 2,99:1) | 3,4:1 |
| `primary` | `#2F52A0` | UMJ primary | Ação principal, links, seleção | 6,9:1 |
| `primary-hover` | `#24417F` | derivado | Hover e pressionado da ação principal | |
| `primary-tint` | `#E3E9F5` | derivado | Fundo de item ativo na navegação | primary 6,1:1 |
| `brand-accent` | `#23B9D6` | UMJ accent | Ciano da marca, **só decorativo** e sempre sobre `ink` (7,2:1). Sobre o papel dá 2,2:1: nunca usar como texto ou borda | |
| `focus` | `#041C40` | UMJ foreground | Anel de foco do teclado | 15,7:1 |
| `error` | `#B91C1C` | UMJ destructive | Erro, cancelamento, conflito | 6,0:1 |
| `warning` | `#92400E` | UMJ warning | Avisos de prazo (ex.: cancelamento perto do limite) | 6,6:1 |
| `success` | `#1A7F37` | UMJ success | Reserva confirmada, sucesso | 4,7:1 |

Do kit UMJ ficam de fora, por conflitarem com a seção 2: fonte Inter, cards brancos, sombras e
raio de 12px. Tema escuro fica para depois do MVP.

## 4. Tipografia

| Papel | Fonte | Pesos | Uso |
|---|---|---|---|
| Display | **Literata** (serifa, Google Fonts) | 500, 600 | Títulos de página, landing, comprovante |
| Interface | **Atkinson Hyperlegible Next** (Google Fonts) | 400, 500, 700 | Todo o resto: textos, botões, campos, tabelas |
| Dados | **Atkinson Hyperlegible Mono** (Google Fonts) | 400, 500 | Horários, datas na grade, código do comprovante |

Carregar com `font-display: swap` e apenas os pesos listados.

| Token | Fonte | Tamanho / altura | Peso |
|---|---|---|---|
| `display` | Literata | 44 / 52 (mobile 34 / 40) | 500 |
| `h1` | Literata | 32 / 40 (mobile 28 / 34) | 500 |
| `h2` | Literata | 24 / 32 | 500 |
| `h3` | Atkinson Next | 18 / 26 | 700 |
| `body` | Atkinson Next | 16 / 26 | 400 |
| `body-sm` | Atkinson Next | 14 / 22 | 400 |
| `label` | Atkinson Next | 14 / 20 | 700 |
| `overline` | Atkinson Next | 12 / 16, caixa alta, `letter-spacing: 0.08em` | 700 |
| `data` | Atkinson Mono | 14 / 20, `font-variant-numeric: tabular-nums` | 500 |

Texto corrido com no máximo 70 caracteres por linha. Corpo nunca menor que 16px no celular.

## 5. Espaço, grade e forma

- **Base de 4px.** Escala: 4, 8, 12, 16, 24, 32, 48, 64, 96.
- **Grade:** 12 colunas, gutter de 24px, conteúdo com largura máxima de 1200px. Margem lateral
  de 16px no celular e 32px a partir de 900px.
- **Shell da aplicação:**
  - Desktop (≥ 900px): navegação lateral fixa de 248px + barra superior de 56px.
  - Celular: barra superior de 56px + navegação inferior com 4 destinos (Início, Reservar,
    Minhas reservas, Conta).
- **Raio:** 2px em botões, campos, chips e diálogos. 0 em tabelas, painéis e grade de horários.
- **Bordas:** 1px `line` para divisórias e 1px `line-strong` para controles.
- **Elevação:** inexistente. Diálogo se destaca pelo fundo `surface`, borda `line-strong` e
  véu `rgba(26, 36, 32, 0.48)` atrás.
- **Camadas (z-index):** conteúdo 0, barra fixa 10, navegação 20, menu/popover 30, diálogo 40,
  snackbar 50.

## 6. Ícones

- **Material Symbols Sharp** pelos componentes `@mui/icons-material` com sufixo `Sharp`
  (`EventSharp`, `MeetingRoomSharp`, `ScheduleSharp`, `QrCode2Sharp`, `CancelSharp`).
- Tamanho 20px dentro de texto e botões, 24px na navegação.
- Ícone sozinho só com `aria-label` e tooltip.
- Cor herda do texto. Ícone nunca é decorativo solto na página.

## 7. Movimento

- **Hover:** troca de cor imediata (`transition: none`). Sem escala, sem deslocamento, sem
  sublinhado animado.
- **Permitido**, até 150ms e `ease-out`: abertura e fechamento de diálogo, drawer e snackbar
  (opacidade e 8px de deslocamento).
- **Skeleton:** pulsação lenta de opacidade (1,6s). Com `prefers-reduced-motion: reduce`, fica
  estático.
- **Ripple do MUI desligado** em todo o app (`disableRipple`).
- Foco do teclado com anel de 2px `focus` e 2px de afastamento, sempre visível.

## 8. Componentes

### Botões
| Variante | Visual | Uso |
|---|---|---|
| Primário | Fundo `primary`, texto `paper`, raio 2px, altura 44px | Uma ação principal por tela |
| Secundário | Fundo transparente, borda 1px `line-strong`, texto `ink` | Ações alternativas |
| Texto | Sem borda, texto `primary`, sublinhado no hover | Ações terciárias e links |
| Perigo | Borda 1px `error`, texto `error`; no diálogo de confirmação vira fundo `error` | Cancelar reserva |

Rótulos com verbo e objeto: "Reservar sala", "Cancelar reserva", "Ver comprovante". Botão em
carregamento mostra indicador e fica desabilitado.

### Campos
- Rótulo **acima** do campo (`label` 14px negrito), nunca rótulo flutuante nem placeholder no
  lugar de rótulo.
- Campo com fundo `surface`, borda `line-strong`, altura 44px, raio 2px. Foco: borda `primary`
  de 2px.
- Erro: borda `error`, mensagem abaixo com ícone `ErrorSharp` e texto, `aria-invalid` e
  `aria-describedby`.
- Ajuda abaixo do campo em `body-sm` `ink-muted`.

### Grade de horários (peça central)
- Coluna de horários em fonte de dados (`08:00`, `08:30`…), blocos de 30 minutos, altura mínima
  de 44px.
- Estados:

| Estado | Visual | Texto acessível |
|---|---|---|
| Livre | Fundo `surface`, borda `line` | "19:00 às 19:30, livre" |
| Ocupado | Textura diagonal com `hatch`, rótulo "Ocupado" | "19:00 às 19:30, ocupado" |
| Selecionado | Fundo `primary`, texto `paper`, ícone `CheckSharp` | "19:00 às 19:30, selecionado" |
| Passado | Fundo `sunken`, texto `ink-disabled`, rótulo "Encerrado" | "19:00 às 19:30, encerrado" |

- Seleção por clique no início e no fim do intervalo. O resumo da seleção fica numa **barra fixa
  inferior** no celular ("19:00 às 21:00 · Sala 204" + botão "Reservar") e numa coluna lateral
  no desktop.

### Lista de reservas
Linhas separadas por fio, sem card. Cada linha: data em fonte de dados à esquerda, nome do
espaço e bloco, horário, rótulo de status e ações à direita. No celular a linha empilha.

### Rótulo de status
Texto em caixa alta 12px com ícone de 16px, sem fundo colorido cheio:
`CONFIRMADA` (`success`, `EventAvailableSharp`), `CANCELADA` (erro, `EventBusySharp`),
`CONCLUÍDA` (`ink-muted`, `HistorySharp`).

### Comprovante
Documento de uma coluna em `surface` com borda `line-strong`: título em Literata, código em
fonte de dados grande (`EDU-7K3F9Q`), QR code de 160px, dados da reserva em pares
rótulo/valor, fio tracejado separando o canhoto. Versão de impressão sem navegação.

### Diálogo de confirmação
Título como pergunta direta ("Deseja cancelar esta reserva?"), resumo em pares rótulo/valor,
ação destrutiva à direita e ação segura com foco inicial.

### Feedback
- **Skeleton** em toda lista, grade e detalhe enquanto carrega, com a mesma geometria do
  conteúdo final (sem salto de layout).
- **Snackbar** em `ink` com texto `paper`, canto inferior esquerdo no desktop e acima da
  navegação inferior no celular. Some em 5s; erros ficam até o usuário fechar.
- **Estado vazio:** uma frase que explica o que falta e uma ação. Sem ilustração genérica.
- **Erro de carregamento:** mensagem em linguagem simples e botão "Tentar de novo".

### Navegação
- Item ativo com fundo `primary-tint` e texto `primary` em negrito.
- **Breadcrumbs** em páginas de segundo nível ou mais
  (`Reservar / Bloco A / Sala 204`, `Administração / Recursos / Editar`).
- **Título único por página** no formato `Página · EduSpace` (`Minhas reservas · EduSpace`).

## 9. Voz e texto

- Português claro, frases curtas, voz ativa, tratamento por "você".
- Sem travessão, sem emoji, sem exclamação em mensagens de sistema.
- Evitar a fórmula "não é X, é Y" e superlativos ("incrível", "revolucionário").
- Datas: `qua, 21 de out`. Horários: `19:00 às 21:00`. Fuso de Maceió implícito.
- Erros dizem o que aconteceu e o que fazer: "Este horário acabou de ser reservado. Escolha
  outro horário na grade."

## 10. Páginas públicas

A aplicação é de uso interno (atrás de login), mas tem uma pequena camada pública para a banca,
para quem chega pelo link e para indexação:

| Página | Conteúdo |
|---|---|
| `/` (deslogado) | Título direto, subtítulo de uma linha, CTA "Entrar com e-mail institucional" acima da dobra, **captura real da grade de horários**, "Como funciona" em 4 passos numerados (a jornada do relatório), 5 perguntas frequentes, rodapé |
| `/sobre` | Projeto, equipe com **foto real**, disciplina e instituição |
| `/ajuda` | Perguntas frequentes e contato do suporte com prazo de resposta ("respondemos em até 1 dia útil") |
| `/termos` | Termos de Uso |
| `/privacidade` | Política de Privacidade (LGPD) |
| `*` | Página 404 com link para o início e para reservar |

Rodapé em todas as páginas públicas: Termos, Privacidade, Sobre, Ajuda, endereço do campus com
link "Como chegar" (Google Maps).

## 11. Referências de inspiração

Consultar antes de desenhar uma seção nova, filtrando sempre pelas regras da seção 2:

- Seções e blocos: [unsection.com](https://www.unsection.com/), [pinstack.app/sections](https://www.pinstack.app/sections), [inspora.design](https://www.inspora.design/), originkit.dev
- Design systems de marcas: [styles.refero.design](https://styles.refero.design/)
- Chamadas para ação: [cta.gallery](https://www.cta.gallery/)
- Componentes: [spell.sh](https://spell.sh/), [reactbits.dev](https://reactbits.dev/), skiper-ui.com, Bencho, [naocodei.com/free-code](https://naocodei.com/free-code/)
- Microinterações e animação: [60fps.design](https://60fps.design/), [microkit.co](https://microkit.co/), Details Vault, [motionsites.ai](https://motionsites.ai/)

Muitos desses acervos são feitos em Tailwind e com animação pesada. No EduSpace servem como
referência de composição e detalhe; a implementação é sempre em MUI com os tokens daqui.

## 12. Checklist de entrega de tela

- [ ] Só tokens deste documento (nenhuma cor, fonte ou raio fora da escala)
- [ ] Nenhum item da seção 2
- [ ] Título único da página e breadcrumbs quando aplicável
- [ ] Skeleton no carregamento, estado vazio e estado de erro
- [ ] Funciona em 360px, 768px e 1280px sem rolagem horizontal
- [ ] Alvos de toque com 44px ou mais
- [ ] Navegável só com teclado, foco visível, diálogos fecham com Esc
- [ ] Contraste AA verificado; estado não depende só de cor
- [ ] Textos revisados pela seção 9
