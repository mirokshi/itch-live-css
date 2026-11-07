// Multi-page React site, prerendered (decisions: same URLs as the old static site, content pages
// work without JavaScript). Build: client entries → dist/assets (manifest), src/server.jsx → dist-ssr,
// then prerender.mjs writes every page's HTML into dist/. Dev: the same render() per request, plus
// api/ through dev.js.

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { apiMiddleware } from './dev.js';

const ENTRIES = ['editor', 'ideas', 'showcase', 'admin', 'docs', 'privacy', 'guide', 'lang'];

function pages() {
  return {
    name: 'pages',
    configureServer(server) {
      server.middlewares.use(apiMiddleware);
      // after Vite's own middlewares (public/, /src, /@vite…): render the page for this URL
      return () =>
        server.middlewares.use(async (req, res, next) => {
          try {
            const url = new URL(req.url, 'http://x').pathname;
            const { render } = await server.ssrLoadModule('/src/server.jsx');
            const html = render(url, (path) => `/src/${path}`);
            if (html === null) return next();
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.end(await server.transformIndexHtml(url, html));
          } catch (err) {
            server.ssrFixStacktrace(err);
            next(err);
          }
        });
    },
  };
}

export default defineConfig(({ isSsrBuild }) => ({
  plugins: [react(), tailwindcss(), pages()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  appType: 'custom',
  // no index.html to crawl: name the entries, so every dependency is pre-bundled once (one React)
  optimizeDeps: { entries: ['src/client/*.jsx'] },
  // 127.0.0.1: Node resolves "localhost" to ::1 only, which browsers that try 127.0.0.1 can't reach
  server: { host: '127.0.0.1', port: 3001, strictPort: true, fs: { allow: ['.', '../engine'] } },
  build: {
    manifest: true,
    copyPublicDir: !isSsrBuild,
    outDir: isSsrBuild ? 'dist-ssr' : 'dist',
    rollupOptions: { input: { styles: 'src/index.css', ...Object.fromEntries(ENTRIES.map((e) => [e, `src/client/${e}.jsx`])) } },
  },
}));
