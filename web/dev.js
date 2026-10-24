// Local server with Vercel's layout: public/ as static files, api/<name>.js as functions (one
// export per HTTP method), and vercel.json's rewrites. → http://localhost:3001
//   npm run dev     (restarts on save)

import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname } from 'node:path';

const PORT = 3001;
const { rewrites } = JSON.parse(await readFile(new URL('./vercel.json', import.meta.url), 'utf8'));
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' };

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

createServer(async (req, res) => {
  try {
    const url = rewrite(new URL(req.url, `http://localhost:${PORT}`));
    const api = url.pathname.match(/^\/api\/([\w-]+)$/);
    if (api) {
      const handler = (await import(`./api/${api[1]}.js`))[req.method];
      if (!handler) return res.writeHead(405).end();
      const hasBody = !['GET', 'HEAD'].includes(req.method);
      const response = await handler(new Request(url, { method: req.method, headers: req.headers, body: hasBody ? req : undefined, duplex: 'half' }));
      res.writeHead(response.status, Object.fromEntries(response.headers));
      return res.end(Buffer.from(await response.arrayBuffer()));
    }
    // flat file names only: nothing outside public/ can be reached
    const name = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
    if (!/^[\w-]+\.\w+$/.test(name)) return res.writeHead(404).end();
    const body = await readFile(new URL(`./public/${name}`, import.meta.url)).catch(() => null);
    if (!body) return res.writeHead(404).end();
    res.writeHead(200, { 'Content-Type': `${TYPES[extname(name)] ?? 'application/octet-stream'}; charset=utf-8` }).end(body);
  } catch (err) {
    console.error(err);
    res.writeHead(500).end(String(err));
  }
}).listen(PORT, () => console.log(`http://localhost:${PORT}`));
