# SEO das páginas públicas

- **Issue:** #48
- **Data da medição local:** 13/10/2026
- **Resultado:** Lighthouse **SEO 100**, Acessibilidade 100 e Boas práticas 100 em `/`, `/sobre`,
  `/ajuda`, `/termos` e `/privacidade` (build de produção, perfil mobile).

## O que foi decidido

| Item                       | Decisão                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Onde fazer SEO             | Só nas páginas públicas. O app logado e os comprovantes recebem `noindex` e ficam no `Disallow` do `robots.txt` (o comprovante mostra o primeiro nome de quem reservou)                                                                                                                                                                                                                                                                                                           |
| Pré-renderização           | Do `<head>` de cada página pública, no build ([`vite.config.ts`](../../frontend/vite.config.ts), plugin `prerender-public-heads`): `sobre/index.html`, `ajuda/index.html`... com título, descrição, canonical, Open Graph, Twitter Card e JSON-LD. Robôs de redes sociais (WhatsApp, LinkedIn) leem essas tags sem executar JavaScript. O corpo continua sendo renderizado pelo React, que o Google executa; renderizar o corpo no build exigiria um navegador no build da Vercel |
| Fonte dos textos           | Um módulo só, [`src/seo/public-seo.ts`](../../frontend/src/seo/public-seo.ts), usado pelo build e pelas páginas, sobre os textos de [`src/content/public-content.ts`](../../frontend/src/content/public-content.ts). Um teste garante que o título e a descrição de cada página são os da tabela de SEO                                                                                                                                                                           |
| Título no navegador        | As tags do HTML são marcadas com `data-seo` e removidas quando o app inicia; dali em diante o React 19 cuida de `<title>` e `<meta name="description">` a cada página (sem isso, o primeiro `<title>` do documento, o fixo, venceria)                                                                                                                                                                                                                                             |
| Dados estruturados         | `WebApplication` com `provider` `CollegeOrUniversity` (UMJ) e `FAQPage` na página inicial; `FAQPage` completo na Ajuda. Sem `LocalBusiness` (não é um negócio) e sem `llms.txt`                                                                                                                                                                                                                                                                                                   |
| Imagem de compartilhamento | `public/og-image.png`, 1200x630: captura real da página inicial com a marca (`scripts/capture-landing.mjs`)                                                                                                                                                                                                                                                                                                                                                                       |
| Ícones                     | `manifest.webmanifest`, ícones 192 e 512 e `apple-touch-icon`, gerados do `favicon.svg` (`scripts/generate-icons.mjs`)                                                                                                                                                                                                                                                                                                                                                            |

## Configuração do deploy

- `VITE_SITE_URL` com o endereço público (sem barra no fim) é obrigatória no build de produção:
  canonical, `og:url`, `og:image`, `robots.txt` e `sitemap.xml` usam URLs absolutas. Sem ela, o
  build avisa e usa `http://localhost:4173`.
- A Vercel serve `sobre/index.html` em `/sobre` antes do rewrite da SPA, então cada página pública
  chega aos robôs com as próprias tags. O `vite preview` local não faz isso (cai sempre no
  `index.html`), por isso a conferência das tags por página é em produção.

## Falta verificar em produção (depende da #19)

- Compartilhar o link no WhatsApp e conferir título, descrição e imagem.
- `https://<site>/robots.txt` e `https://<site>/sitemap.xml` acessíveis; enviar o sitemap no
  Google Search Console.
- Rich Results Test do Google sem erros no FAQ de `/` e `/ajuda`.
