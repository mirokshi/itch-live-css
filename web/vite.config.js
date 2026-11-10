// React Router (framework mode, prerendered: react-router.config.js) + Tailwind. api/ runs through
// dev.js in the dev server, like Vercel's functions.

import { reactRouter } from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { apiMiddleware } from './dev.js';

export default defineConfig({
  plugins: [{ name: 'api', configureServer: (server) => void server.middlewares.use(apiMiddleware) }, tailwindcss(), reactRouter()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  // 127.0.0.1: Node resolves "localhost" to ::1 only, which browsers that try 127.0.0.1 can't reach
  server: { host: '127.0.0.1', port: 3001, strictPort: true, fs: { allow: ['.', '../engine'] } },
});
