// service/: the template for running your own copy of the service, with its example config.json.
// It reuses web/lib, so a change here that breaks it fails this test.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

process.env.ITCH_API_KEY = 'key';
globalThis.fetch = async (url) => {
  if (String(url).startsWith('https://fonts.googleapis.com/css2?')) {
    return new Response('@font-face{font-family:"Syne";src:url(https://fonts.gstatic.com/s/syne/v1/a.woff2) format("woff2")}', { headers: { 'Content-Type': 'text/css' } });
  }
  if (String(url) === 'https://api.itch.io/profile/games') {
    return Response.json({ games: [{ id: 2660825, published: true, views_count: 1840, downloads_count: 3, published_at: '2024-03-02T10:00:00Z' }] });
  }
  throw new Error(`unexpected fetch: ${url}`);
};

const live = await import('../../service/api/live.js');
const bio = await import('../../service/api/bio.js');

test('/live.css serves the example config: effects, fonts inlined, the key owner\'s games on the cards', async () => {
  const res = await live.GET();
  const css = await res.text();
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('content-type'), 'text/css; charset=utf-8');
  assert.equal(res.headers.get('cache-control'), 'no-store');
  assert.match(css, /@font-face/);
  assert.doesNotMatch(css, /@import/);
  assert.match(css, /\.custom-title/);
  assert.match(css, /\.custom-hello/);
  assert.match(css, /data-game_id="2660825"/);
});

test('/api/bio gives the HTML the title and greeting hook into', async () => {
  const text = await (await bio.GET()).text();
  assert.match(text, /^<h1 class="custom-title"><span>H<\/span>/);
  assert.match(text, /<span class="custom-hello">Hi!<\/span>/);
});

test('the small repo users fork (service/publish.mjs) builds and serves on its own', async () => {
  // inside engine/node_modules, so the copy finds postcss without links
  const out = fileURLToPath(new URL('../../engine/node_modules/.cache/service-repo', import.meta.url));
  execFileSync(process.execPath, [fileURLToPath(new URL('../../service/publish.mjs', import.meta.url)), out]);
  const res = await (await import(pathToFileURL(join(out, 'api/live.js')))).GET();
  assert.equal(res.status, 200);
  assert.match(await res.text(), /data-game_id="2660825"/);
  assert.equal(JSON.parse(readFileSync(join(out, 'vercel.json'), 'utf8')).installCommand, undefined);
  assert.equal(JSON.parse(readFileSync(join(out, 'package-lock.json'), 'utf8')).packages[''].name, 'itch-live-css-service');
});
