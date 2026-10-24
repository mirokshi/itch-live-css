import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

process.env.FAKE_STORE = join(mkdtempSync(join(tmpdir(), 'itch-live-css-')), 'store.json');
const { bioHtml, build, check, pasteForProfile } = await import('../lib/config.js');
const configs = await import('../api/configs.js');
const css = await import('../api/css.js');

const form = {
  accent: '#FFC857',
  title: { text: 'Mirokshi', fonts: ['syne', 'hand', 'playfair'] },
  greeting: { first: '¡Hola!', others: ['Hello!', 'Olá!'] },
  cards: true,
  ascii: false,
};
const req = (path, method = 'GET', body, key) =>
  new Request(`https://x.test${path}`, {
    method,
    body: body && JSON.stringify(body),
    headers: key ? { Authorization: `Bearer ${key}` } : {},
  });

test('check keeps known fields only and rejects bad input', () => {
  assert.deepEqual(check({ ...form, extra: 1, cards: 'yes' }), { ...form, accent: '#ffc857', cards: false, reserve: 0 });
  assert.equal(check({ ...form, reserve: 1024 }).reserve, 1024);
  for (const reserve of [-1, 1.5, 5001, '100']) assert.throws(() => check({ ...form, reserve }), /reserve/);
  assert.throws(() => check({ ...form, accent: 'red;}body{' }), /accent/);
  assert.throws(() => check({ ...form, title: { text: 'A', fonts: ['syne', 'nope'] } }), /fonts/);
  assert.throws(() => check({ ...form, title: { text: 'A', fonts: ['syne'] } }), /fonts/);
  assert.throws(() => check({ ...form, greeting: { first: 'Hi', others: [] } }), /greeting/);
  assert.throws(() => check(null), /object/);
});

test('build: fonts @import first, accent variable, every plugin', () => {
  const out = build(check(form), { seed: 1 });
  assert.match(out, /^@import url\("https:\/\/fonts\.googleapis\.com\/css2\?family=Syne/);
  assert.match(out, /--gold:#ffc857/);
  assert.match(out, /custom-breath/);
  assert.match(out, /custom-hello/);
  assert.match(out, /custom-foil/);
  assert.doesNotMatch(out, /custom-ascii/);
  assert.equal(build(check(form), { seed: 1 }), out);
});

test('pasteForProfile: @import first, plugins in a layer, within the profile cap', () => {
  const url = 'https://example.com/c/abcdefgh.css';
  const big = check({ ...form, greeting: { first: '¡Hola!', others: Array(20).fill('Bonjour tout le monde !') }, ascii: true });
  const p = pasteForProfile(big, url);
  assert.ok(p.css.startsWith('@import url("https://example.com/c/abcdefgh.css");\n@import url("https://fonts.googleapis.com/'));
  assert.match(p.css, /\n@layer custom-fallback\{:root\{--gold:#ffc857/);
  assert.equal(p.size.fits, true);
  assert.ok(p.size.bytes <= 5120);
  assert.deepEqual([...p.included, ...p.left].sort(), ['ascii', 'cards', 'greeting', 'title']);
  assert.ok(p.left.includes('ascii')); // its SVGs alone are ~25 KB
  assert.equal(pasteForProfile(big, url).css, p.css); // fixed seed: the same paste on every save

  // reserve: the copy only takes what's left; with 4000 reserved, nothing but the @import lines fits
  const reserved = pasteForProfile({ ...big, reserve: 2000 }, url);
  assert.ok(reserved.size.bytes + 2000 <= 5120);
  assert.ok(reserved.included.length < p.included.length);
  assert.deepEqual(pasteForProfile({ ...big, reserve: 4000 }, url).included, []);

  const none = pasteForProfile(check({ accent: '#000000' }), url);
  assert.deepEqual([none.included, none.left], [[], []]);
  assert.doesNotMatch(none.css, /fonts\.googleapis/);
  assert.throws(() => pasteForProfile(big, 'http://example.com/c/abcdefgh.css'), /https/);
});

test('bioHtml escapes the user text', () => {
  const html = bioHtml(check({ ...form, title: { text: '<b>', fonts: ['syne', 'mono'] } }));
  assert.match(html, /<span>&#60;<\/span><span>b<\/span><span>&#62;<\/span>/);
  assert.match(html, /<span class="custom-hello">¡Hola!<\/span>/);
});

test('save, serve, edit with the key only', async () => {
  const res = await configs.POST(req('/api/configs', 'POST', form));
  assert.equal(res.status, 201);
  const { id, key, bio, paste } = await res.json();
  assert.match(bio, /custom-title/);
  assert.ok(paste.css.startsWith(`@import url("https://x.test/c/${id}.css");`));

  const served = await css.GET(req(`/api/css?file=${id}.css`));
  assert.equal(served.status, 200);
  assert.equal(served.headers.get('cache-control'), 'no-store');
  assert.match(await served.text(), /--gold:#ffc857/);

  assert.equal((await configs.GET(req(`/api/configs?id=${id}`, 'GET', null, 'wrong'))).status, 404);
  assert.equal((await configs.PUT(req(`/api/configs?id=${id}`, 'PUT', { ...form, accent: '#000000' }, 'wrong'))).status, 404);
  assert.equal((await configs.PUT(req(`/api/configs?id=${id}`, 'PUT', { ...form, accent: '#123456' }, key))).status, 200);
  assert.deepEqual((await (await configs.GET(req(`/api/configs?id=${id}`, 'GET', null, key))).json()).form.accent, '#123456');
  assert.match(await (await css.GET(req(`/api/css?file=${id}.css`))).text(), /--gold:#123456/);

  assert.equal((await css.GET(req('/api/css?file=nope.css'))).status, 404);
  assert.equal((await configs.POST(req('/api/configs', 'POST', { accent: 'x' }))).status, 400);
});
