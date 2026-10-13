import { fileURLToPath, URL } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
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
