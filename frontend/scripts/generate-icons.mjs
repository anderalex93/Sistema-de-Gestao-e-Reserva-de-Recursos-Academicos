// Gera os ícones PNG do manifest e do iOS a partir de public/favicon.svg (#48).
// Uso: node scripts/generate-icons.mjs
import { mkdirSync, readFileSync } from 'node:fs';

import { chromium } from '@playwright/test';

const SIZES = [
  { file: 'icon-192.png', size: 192 },
  { file: 'icon-512.png', size: 512 },
  { file: 'apple-touch-icon.png', size: 180 },
];

const svg = readFileSync('public/favicon.svg', 'utf8');
mkdirSync('public/icons', { recursive: true });

const browser = await chromium.launch();
await Promise.all(
  SIZES.map(async ({ file, size }) => {
    const page = await browser.newPage({ viewport: { width: size, height: size } });
    await page.setContent(
      `<style>html,body{margin:0}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`,
    );
    await page.screenshot({ path: `public/icons/${file}` });
  }),
);
await browser.close();
