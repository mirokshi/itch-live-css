// Vercel's functions in the local dev server: api/<name>.js (one export per HTTP method) and
// vercel.json's rewrites, as a middleware that vite.config.js adds to Vite's dev server.
// shortcut: handlers load once; restart `npm run dev` after editing api/ or lib/.

import { readFile } from 'node:fs/promises';

const { rewrites } = JSON.parse(await readFile(new URL('./vercel.json', import.meta.url), 'utf8'));

// vercel.json rewrites; only ":name" segments, all this project uses
function rewrite(url) {
  for (const { source, destination } of rewrites) {
    const names = [];
    const re = new RegExp(`^${source.replace(/:(\w+)/g, (_, k) => (names.push(k), '([^/]+)'))}$`);
    const m = url.pathname.match(re);
    if (!m) continue;
    const dest = new URL(names.reduce((d, k, i) => d.replaceAll(`:${k}`, m[i + 1]), destination), url);
    url.searchParams.forEach((v, k) => dest.searchParams.append(k, v));
    return dest;
  }
  return url;
}

export async function apiMiddleware(req, res, next) {
  const url = rewrite(new URL(req.url, `http://${req.headers.host}`));
  const api = url.pathname.match(/^\/api\/([\w-]+)$/);
  if (!api) return next();
  try {
    // by URL: Vite bundles this file into its config, so a relative import() would miss api/
    const handler = (await import(new URL(`./api/${api[1]}.js`, import.meta.url).href))[req.method];
    if (!handler) return res.writeHead(405).end();
    const hasBody = !['GET', 'HEAD'].includes(req.method);
    const response = await handler(new Request(url, { method: req.method, headers: req.headers, body: hasBody ? req : undefined, duplex: 'half' }));
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch (err) {
    console.error(err);
    res.writeHead(500).end(String(err));
  }
}
