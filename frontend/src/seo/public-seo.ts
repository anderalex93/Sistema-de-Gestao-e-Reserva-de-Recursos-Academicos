/**
 * SEO das páginas públicas (#48): títulos, descrições, Open Graph, JSON-LD, robots.txt e
 * sitemap.xml. É lido pelo navegador (metatags renderizadas pelo React) e pelo build
 * (`vite.config.ts`, em Node, grava o <head> de cada página pública). Por isso usa import
 * relativo: o alias `@/` não existe no carregamento do config.
 */
import { helpFaq, institution, mainFaq, product, type FaqItem } from '../content/public-content.ts';

export const APP_NAME = 'EduSpace';

export interface SeoPage {
  path: string;
  /** Título da página, sem o sufixo " · EduSpace". */
  title: string;
  /** Até 155 caracteres: o que cabe no resultado de busca. */
  description: string;
  inSitemap: boolean;
  jsonLd?: (siteUrl: string) => object[];
}

/** Imagem de compartilhamento: captura real da página inicial com a marca (1200x630). */
export const OG_IMAGE = {
  path: '/og-image.png',
  width: 1200,
  height: 630,
  alt: 'Página inicial do EduSpace com a grade de horários de uma sala de estudo da UMJ.',
} as const;

/** Rotas do app logado e dos comprovantes: fora dos buscadores. */
export const PRIVATE_PREFIXES = [
  '/inicio',
  '/reservar',
  '/quadro',
  '/recursos',
  '/minhas-reservas',
  '/comprovantes',
  '/checkin',
  '/conta',
  '/admin',
] as const;

export function fullTitle(title: string): string {
  return `${title} · ${APP_NAME}`;
}

function faqPage(items: readonly FaqItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.pergunta,
      acceptedAnswer: { '@type': 'Answer', text: item.resposta },
    })),
  };
}

const university = {
  '@type': 'CollegeOrUniversity',
  name: institution.nome,
  alternateName: institution.sigla,
  url: institution.url,
  address: {
    '@type': 'PostalAddress',
    addressLocality: institution.cidade,
    addressRegion: institution.estado,
    addressCountry: 'BR',
  },
};

function webApplication(siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: APP_NAME,
    url: `${siteUrl}/`,
    description: product.descricao,
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Web',
    inLanguage: 'pt-BR',
    isAccessibleForFree: true,
    provider: university,
  };
}

export const SEO_PAGES: readonly SeoPage[] = [
  {
    path: '/',
    title: 'Reserva de salas e equipamentos da UMJ',
    description:
      'Reserve salas de estudo, laboratórios, auditório e equipamentos do campus da UMJ pelo ' +
      'celular, com grade de horários e comprovante com QR code.',
    inSitemap: true,
    jsonLd: (siteUrl) => [webApplication(siteUrl), faqPage(mainFaq)],
  },
  {
    path: '/sobre',
    title: 'Sobre o EduSpace',
    description:
      'O EduSpace é o sistema de reserva de espaços da UMJ, feito na disciplina Projeto ' +
      'Integrador I. Conheça o projeto e a equipe.',
    inSitemap: true,
  },
  {
    path: '/ajuda',
    title: 'Ajuda',
    description:
      'Quem pode reservar, até quando cancelar, quanto tempo dura uma reserva, como usar o ' +
      'comprovante do EduSpace e a quem recorrer em caso de dúvida.',
    inSitemap: true,
    jsonLd: () => [faqPage(helpFaq)],
  },
  {
    path: '/termos',
    title: 'Termos de Uso',
    description:
      'Regras de uso do EduSpace: quem pode reservar, duração, antecedência, cancelamento e ' +
      'responsabilidade pelo espaço e pelos equipamentos.',
    inSitemap: true,
  },
  {
    path: '/privacidade',
    title: 'Aviso de Privacidade',
    description:
      'Quais dados o EduSpace guarda, para quê, por quanto tempo, como usa cookies e como ' +
      'você exerce os seus direitos pela LGPD.',
    inSitemap: true,
  },
  {
    path: '/login',
    title: 'Entrar',
    description:
      'Entre no EduSpace com o seu e-mail institucional da UMJ para reservar salas, ' +
      'laboratórios e equipamentos do campus.',
    inSitemap: false,
  },
  {
    path: '/cadastro',
    title: 'Criar conta',
    description:
      'Crie a sua conta no EduSpace com o e-mail institucional da UMJ em menos de um minuto ' +
      'e comece a reservar espaços do campus.',
    inSitemap: false,
  },
];

export function seoPageFor(pathname: string): SeoPage | undefined {
  const normalized = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  return SEO_PAGES.find((page) => page.path === normalized);
}

export function isPrivatePath(pathname: string): boolean {
  return PRIVATE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function escapeAttribute(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

/** JSON dentro de <script>: `<` escapado para nunca fechar a tag antes da hora. */
function jsonForScript(value: object): string {
  return JSON.stringify(value).replaceAll('<', '\\u003c');
}

/**
 * Tags do <head> de uma página pública. As marcadas com `data-seo` são removidas quando o app
 * inicia, e o React passa a cuidar de título e descrição a cada troca de página.
 */
export function headTags(page: SeoPage, siteUrl: string): string {
  const url = `${siteUrl}${page.path === '/' ? '/' : page.path}`;
  const title = escapeAttribute(fullTitle(page.title));
  const description = escapeAttribute(page.description);
  const image = `${siteUrl}${OG_IMAGE.path}`;
  const tags = [
    `<title data-seo>${title}</title>`,
    `<meta data-seo name="description" content="${description}" />`,
    `<link data-seo rel="canonical" href="${url}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${APP_NAME}" />`,
    `<meta property="og:locale" content="pt_BR" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:image" content="${image}" />`,
    `<meta property="og:image:width" content="${OG_IMAGE.width}" />`,
    `<meta property="og:image:height" content="${OG_IMAGE.height}" />`,
    `<meta property="og:image:alt" content="${escapeAttribute(OG_IMAGE.alt)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${description}" />`,
    `<meta name="twitter:image" content="${image}" />`,
    ...(page.jsonLd?.(siteUrl) ?? []).map(
      (data) => `<script type="application/ld+json">${jsonForScript(data)}</script>`,
    ),
  ];
  return tags.join('\n    ');
}

/** Troca o título e a descrição genéricos do index.html pelos da página. */
export function injectHead(html: string, page: SeoPage, siteUrl: string): string {
  const withoutGeneric = html
    .replace(/<title[^>]*>[\s\S]*?<\/title>\s*/, '')
    .replace(/<meta[^>]*name="description"[^>]*>\s*/, '');
  return withoutGeneric.replace('</head>', `  ${headTags(page, siteUrl)}\n  </head>`);
}

export function robotsTxt(siteUrl: string): string {
  return [
    'User-agent: *',
    'Allow: /',
    ...PRIVATE_PREFIXES.map((prefix) => `Disallow: ${prefix}`),
    '',
    `Sitemap: ${siteUrl}/sitemap.xml`,
    '',
  ].join('\n');
}

export function sitemapXml(siteUrl: string): string {
  const urls = SEO_PAGES.filter((page) => page.inSitemap)
    .map((page) => `  <url><loc>${siteUrl}${page.path === '/' ? '/' : page.path}</loc></url>`)
    .join('\n');
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urls,
    '</urlset>',
    '',
  ].join('\n');
}
