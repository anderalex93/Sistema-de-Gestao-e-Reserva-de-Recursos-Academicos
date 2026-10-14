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

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
