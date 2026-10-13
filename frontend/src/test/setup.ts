import '@testing-library/jest-dom/vitest';

import { cleanup, configure } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';

import { server } from '@/test/server';

// Páginas são carregadas sob demanda; a primeira importação de um módulo pode passar de 1s.
configure({ asyncUtilTimeout: 5_000 });

// Pré-carrega as páginas lazy: sem isso, o primeiro teste de cada arquivo paga a transformação
// a frio dos módulos e estoura o tempo das buscas assíncronas.
const pages = import.meta.glob('/src/pages/*Page.tsx');
beforeAll(async () => {
  await Promise.all(Object.values(pages).map((load) => load()));
}, 60_000);

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
afterEach(() => {
  cleanup();
  window.localStorage.clear();
  server.resetHandlers();
});
afterAll(() => server.close());
