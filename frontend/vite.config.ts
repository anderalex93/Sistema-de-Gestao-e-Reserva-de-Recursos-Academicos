import { fileURLToPath, URL } from 'node:url';

import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

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

export default defineConfig({
  plugins: [react(), preloadCriticalFonts()],
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
});
