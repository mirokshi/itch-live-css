#!/usr/bin/env node
// node bin/cli.js measure <file.css> <profile|project|jam>: the CSS's size as itch stores it, against
//   that page type's cap. Exit code 1 when itch would refuse it.
// node bin/cli.js validate <file.css> <profile|project|jam> [--served]: the knowledge base's rules
//   (R ids). --served: the file comes through @import, so the cap doesn't apply. Exit code 1 on errors.
// node --watch bin/cli.js dev <config.js> [port]: serves http://localhost:3000/live.css, rendered
//   fresh on each request, as the service will. config.js exports `config` and, if it has outside
//   inputs, `data` (e.g. { games }). --watch restarts it when the config or the engine changes.

import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { measure, render, validate } from '../src/index.js';

const [cmd, file, page, flag] = process.argv.slice(2);
if (!(['measure', 'validate'].includes(cmd) && file && page) && !(cmd === 'dev' && file)) {
  console.error('usage: node bin/cli.js measure <file.css> <profile|project|jam>');
  console.error('       node bin/cli.js validate <file.css> <profile|project|jam> [--served]');
  console.error('       node --watch bin/cli.js dev <config.js> [port]');
  process.exit(2);
}
try {
  if (cmd === 'dev') {
    const { config, data } = await import(pathToFileURL(resolve(file)));
    if (!config?.plugins) throw new Error(`${file} must export a config: { plugins: [...] }`);
    const port = Number(page ?? 3000);
    createServer((req, res) => {
      if (new URL(req.url, 'http://localhost').pathname !== '/live.css') return res.writeHead(404).end();
      try {
        const css = render(config, { data });
        res.writeHead(200, { 'Content-Type': 'text/css; charset=utf-8', 'Cache-Control': 'no-store' }).end(css);
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' }).end(err.message);
      }
    }).listen(port, 'localhost', () => console.log(`http://localhost:${port}/live.css`));
  } else if (cmd === 'measure') {
    const { chars, bytes, limit, fits } = measure(readFileSync(file, 'utf8'), page);
    const cap = limit ? ` of ${limit.max} ${limit.unit}${limit.exact ? '' : ' known to save'}` : '';
    const verdict = !limit ? 'no cap' : fits ? 'fits' : fits === false ? 'too big: itch refuses the save' : 'unknown: past the largest size known to save';
    console.log(`${page}: ${chars} characters, ${bytes} bytes${cap} → ${verdict}`);
    process.exitCode = fits === false ? 1 : 0;
  } else {
    const problems = validate(readFileSync(file, 'utf8'), page, { served: flag === '--served' });
    for (const p of problems) console.log(`${p.level} ${p.rule}: ${p.message}`);
    console.log(problems.length ? `${problems.length} problem(s); rules in knowledge/itch-custom-css.md §0` : 'no problems found');
    process.exitCode = problems.some((p) => p.level === 'error') ? 1 : 0;
  }
} catch (err) {
  console.error(err.message);
  process.exit(2);
}
