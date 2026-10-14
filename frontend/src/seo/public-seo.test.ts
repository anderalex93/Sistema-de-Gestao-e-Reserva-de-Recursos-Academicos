import { describe, expect, it } from 'vitest';

import { helpFaq, mainFaq } from '@/content/public-content';
import {
  headTags,
  injectHead,
  isPrivatePath,
  robotsTxt,
  SEO_PAGES,
  seoPageFor,
  sitemapXml,
  type SeoPage,
} from '@/seo/public-seo';

const SITE = 'https://eduspace.exemplo.br';
const TEMPLATE = `<!doctype html><html lang="pt-BR"><head>
<meta
  data-seo
  name="description"
  content="Genérica"
/>
<title data-seo>EduSpace</title>
</head><body><div id="root"></div></body></html>`;

function page(path: string): SeoPage {
  const found = seoPageFor(path);
  if (!found) throw new Error(`Sem SEO para ${path}`);
  return found;
}

function jsonLd(html: string): Record<string, unknown>[] {
  return [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)].map(
    (match) => JSON.parse(match[1] ?? '{}') as Record<string, unknown>,
  );
}

describe('public SEO pages', () => {
  it('has a unique title and a description of up to 155 characters for every public page', () => {
    const titles = SEO_PAGES.map((item) => item.title);
    expect(new Set(titles).size).toBe(titles.length);
    for (const item of SEO_PAGES) {
      expect(item.description.length).toBeLessThanOrEqual(155);
      expect(item.description.length).toBeGreaterThan(50);
    }
  });

  it('keeps the logged area and the receipts out of search engines', () => {
    for (const path of [
      '/inicio',
      '/reservar',
      '/recursos/12',
      '/comprovantes/EDU-7K3F9Q',
      '/admin/usuarios',
    ]) {
      expect(isPrivatePath(path)).toBe(true);
    }
    for (const item of SEO_PAGES) expect(isPrivatePath(item.path)).toBe(false);
  });
});

describe('headTags', () => {
  it('writes title, description, canonical, Open Graph and Twitter Card with absolute URLs', () => {
    const html = headTags(page('/sobre'), SITE);

    expect(html).toContain('<title data-seo>Sobre o EduSpace · EduSpace</title>');
    expect(html).toContain(`<link data-seo rel="canonical" href="${SITE}/sobre" />`);
    expect(html).toContain('<meta property="og:locale" content="pt_BR" />');
    expect(html).toContain(`<meta property="og:url" content="${SITE}/sobre" />`);
    expect(html).toContain(`<meta property="og:image" content="${SITE}/og-image.png" />`);
    expect(html).toContain('<meta property="og:image:width" content="1200" />');
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image" />');
  });

  it('describes the landing as a web application of the university, with its FAQ', () => {
    const [app, faq] = jsonLd(headTags(page('/'), SITE));

    expect(app).toMatchObject({
      '@type': 'WebApplication',
      url: `${SITE}/`,
      inLanguage: 'pt-BR',
      provider: { '@type': 'CollegeOrUniversity', alternateName: 'UMJ' },
    });
    expect(faq).toMatchObject({ '@type': 'FAQPage' });
    expect(faq?.mainEntity).toHaveLength(mainFaq.length);
  });

  it('marks up the whole help FAQ', () => {
    const [faq] = jsonLd(headTags(page('/ajuda'), SITE));

    expect(faq?.mainEntity).toEqual(
      helpFaq.map((item) => ({
        '@type': 'Question',
        name: item.pergunta,
        acceptedAnswer: { '@type': 'Answer', text: item.resposta },
      })),
    );
  });

  it('never lets data close the script or break an attribute', () => {
    const tricky: SeoPage = {
      path: '/x',
      title: 'A "B" <c>',
      description: 'd',
      inSitemap: false,
      jsonLd: () => [{ text: '</script><script>alert(1)</script>' }],
    };

    const html = headTags(tricky, SITE);

    expect(html).toContain('A &quot;B&quot; &lt;c&gt; · EduSpace');
    expect(html).not.toContain('</script><script>');
    expect(html).toContain('\\u003c/script>');
  });
});

describe('injectHead', () => {
  it('replaces the generic title and description of index.html once', () => {
    const html = injectHead(TEMPLATE, page('/ajuda'), SITE);

    expect(html.match(/<title/g)).toHaveLength(1);
    expect(html.match(/name="description"/g)).toHaveLength(1);
    expect(html).not.toContain('Genérica');
    expect(html).toContain('<title data-seo>Ajuda · EduSpace</title>');
    expect(html).toContain('<div id="root"></div>');
  });
});

describe('robots.txt and sitemap.xml', () => {
  it('allows the public pages, blocks the private ones and points to the sitemap', () => {
    const robots = robotsTxt(SITE);

    expect(robots).toContain('User-agent: *\nAllow: /');
    for (const path of ['/reservar', '/minhas-reservas', '/recursos', '/comprovantes', '/admin']) {
      expect(robots).toContain(`Disallow: ${path}\n`);
    }
    expect(robots).toContain(`Sitemap: ${SITE}/sitemap.xml`);
  });

  it('lists only the public content pages', () => {
    const sitemap = sitemapXml(SITE);
    const locs = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);

    expect(sitemap).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(locs).toEqual([
      `${SITE}/`,
      `${SITE}/sobre`,
      `${SITE}/ajuda`,
      `${SITE}/termos`,
      `${SITE}/privacidade`,
    ]);
  });
});
