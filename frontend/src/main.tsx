import '@fontsource/literata/500.css';
import '@fontsource/atkinson-hyperlegible-next/400.css';
import '@fontsource/atkinson-hyperlegible-next/500.css';
import '@fontsource/atkinson-hyperlegible-next/700.css';
import '@fontsource/atkinson-hyperlegible-mono/400.css';
import '@fontsource/atkinson-hyperlegible-mono/500.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from '@/App';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Elemento #root não encontrado no index.html.');
}

// Título, descrição e canonical do HTML servem aos robôs que não executam JavaScript (#48).
// Com o app no ar, o React cuida deles a cada página; sem esta limpeza, o título fixo do HTML
// venceria o da página (o navegador usa o primeiro <title> do documento).
for (const element of document.head.querySelectorAll('[data-seo]')) element.remove();

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
