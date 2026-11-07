// After `vite build` (client) and `vite build --ssr src/server.jsx`: writes every page's HTML into
// dist/, at the same paths the old static site had, with the hashed client script from the manifest.

import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = new URL('./dist/', import.meta.url);
const manifest = JSON.parse(readFileSync(new URL('.vite/manifest.json', dist), 'utf8'));
const { render, routes } = await import('./dist-ssr/server.js');

for (const url of routes) {
  const html = render(url, (path) => `/${manifest[`src/${path}`].file}`);
  if (!html) throw new Error(`prerender: nothing for ${url}`);
  const file = new URL(`.${url.endsWith('/') ? `${url}index.html` : url}`, dist);
  mkdirSync(dirname(fileURLToPath(file)), { recursive: true });
  writeFileSync(file, html);
}
rmSync(new URL('./dist-ssr/', import.meta.url), { recursive: true });
console.log(`prerender: ${routes.length} pages`);
