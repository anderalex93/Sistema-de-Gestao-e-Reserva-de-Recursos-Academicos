import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, URL } from 'node:url';

import react from '@vitejs/plugin-react';
import { loadEnv, type Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

import { injectHead, robotsTxt, SEO_PAGES, sitemapXml } from './src/seo/public-seo.ts';

/**
 * Fontes do primeiro render (corpo, negrito e títulos). Sem o preload, elas só são descobertas
 * depois do CSS e chegam com a página já desenhada: a troca de fonte desloca o conteúdo (CLS).
 */
const CRITICAL_FONTS = [
  /^atkinson-hyperlegible-next-latin-400-normal-.*\.woff2$/,
  /^atkinson-hyperlegible-next-latin-700-normal-.*\.woff2$/,
  /^literata-latin-500-normal-.*\.woff2$/,
];

function preloadCriticalFonts(): Plugin {
  return {
    name: 'eduspace:preload-critical-fonts',
    apply: 'build',
    transformIndexHtml(_html, context) {
      const files = Object.keys(context.bundle ?? {});
      return CRITICAL_FONTS.flatMap((pattern) =>
        files
          .filter((file) => pattern.test(file.split('/').pop() ?? ''))
          .map((file) => ({
            tag: 'link',
            attrs: {
              rel: 'preload',
              href: `/${file}`,
              as: 'font',
              type: 'font/woff2',
              crossorigin: '',
            },
            injectTo: 'head' as const,
          })),
      );
    },
  };
}

/**
 * Pré-renderiza o <head> das páginas públicas (#48): cada uma ganha um `index.html` próprio com
 * título, descrição, Open Graph e JSON-LD, que robôs de redes sociais leem sem executar o
 * JavaScript. Também gera o robots.txt e o sitemap.xml com a URL pública do site.
 */
function prerenderPublicHeads(siteUrl: string): Plugin {
  return {
    name: 'eduspace:prerender-public-heads',
    apply: 'build',
    writeBundle(options) {
      const outDir = options.dir ?? 'dist';
      const template = readFileSync(join(outDir, 'index.html'), 'utf8');
      for (const page of SEO_PAGES) {
        const html = injectHead(template, page, siteUrl);
        const dir = join(outDir, page.path);
        mkdirSync(dir, { recursive: true });
        writeFileSync(join(dir, 'index.html'), html);
        // `sobre.html` ao lado de `sobre/index.html`: com `cleanUrls` a Vercel serve o primeiro
        // em `/sobre`, sem redirecionar para a barra no fim.
        if (page.path !== '/') writeFileSync(join(outDir, `${page.path.slice(1)}.html`), html);
      }
      writeFileSync(join(outDir, 'robots.txt'), robotsTxt(siteUrl));
      writeFileSync(join(outDir, 'sitemap.xml'), sitemapXml(siteUrl));
    },
  };
}

const LOCAL_SITE_URL = 'http://localhost:4173';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const siteUrl = (env.VITE_SITE_URL || LOCAL_SITE_URL).replace(/\/+$/, '');
  if (mode === 'production' && !env.VITE_SITE_URL) {
    console.warn(
      `VITE_SITE_URL não definida: canonical, Open Graph e sitemap usarão ${LOCAL_SITE_URL}.`,
    );
  }
  return {
    plugins: [react(), preloadCriticalFonts(), prerenderPublicHeads(siteUrl)],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 5173,
      strictPort: true,
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      restoreMocks: true,
      testTimeout: 15_000,
      // Processos reaproveitados entre arquivos: o ambiente jsdom e as páginas não são
      // recarregados do zero a cada arquivo. O estado global é limpo no setup (MSW, storage, DOM).
      pool: 'forks',
      isolate: false,
    },
  };
});
