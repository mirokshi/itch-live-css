import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

process.env.FAKE_STORE = join(mkdtempSync(join(tmpdir(), 'itch-live-css-')), 'store.json');
const { bioHtml, build, check } = await import('../lib/config.js');
const configs = await import('../api/configs.js');
const css = await import('../api/css.js');

const form = {
  accent: '#FFC857',
  title: { text: 'Mirokshi', fonts: ['syne', 'hand', 'playfair'] },
  greeting: { first: '¡Hola!', others: ['Hello!', 'Olá!'] },
  foil: true,
  badges: true,
  ascii: false,
  scheme: false,
  reveal: false,
  progress: false,
  parallax: false,
};
const req = (path, method = 'GET', body, key) =>
  new Request(`https://x.test${path}`, {
    method,
    body: body && JSON.stringify(body),
    headers: key ? { Authorization: `Bearer ${key}` } : {},
  });

test('check keeps known fields only and rejects bad input', () => {
  assert.deepEqual(check({ ...form, extra: 1, foil: 'yes', badges: 1 }), { page: 'profile', ...form, accent: '#ffc857', foil: false, badges: false, foilColor: '#2f27ce', foilWidth: 1.5, foilSpeed: 1, foilSync: false, reveal: false, progress: false, parallax: false, css: '', html: '', showcase: null });
  const legacy = check({ ...form, foil: undefined, badges: undefined, cards: true }); // saved before foil and badges were split
  assert.ok(legacy.foil && legacy.badges);
  assert.equal(check({ ...form, page: 'devlog' }).page, 'devlog');
  assert.equal(check({ ...form, page: 'project' }).foil, false); // the cards effects are profile-only
  assert.equal(check({ ...form, page: 'project' }).badges, false);
  assert.throws(() => check({ ...form, page: 'jam' }), /page/);
  assert.equal(check({ ...form, css: 'a{}', html: '<p>x</p>' }).html, '<p>x</p>');
  assert.throws(() => check({ ...form, css: 'a'.repeat(50001) }), /css/);
  assert.throws(() => check({ ...form, html: 'a'.repeat(5001) }), /html/);
  assert.throws(() => check({ ...form, css: 3 }), /css/);
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

test('build: the user CSS goes last, its leading @imports go to the top', () => {
  const user = ['/* mine */', '@import url("https://fonts.example/a;b.css");', '#wrapper .user_page{color:red}'].join('\n');
  const out = build(check({ ...form, css: user }), { seed: 1 });
  const lines = out.split('\n');
  assert.match(lines[0], /fonts\.googleapis/);
  assert.deepEqual(lines.slice(1, 3), ['/* mine */', '@import url("https://fonts.example/a;b.css");']);
  assert.match(lines[3], /^#wrapper\{--gold:/); // R3: never :root
  assert.ok(out.endsWith('#wrapper .user_page{color:red}\n'));
  assert.ok(out.indexOf('custom-foil') < out.indexOf('color:red'));
  assert.ok(build(check(form), { seed: 1 }).endsWith('}\n')); // no css: nothing appended
});

test('bioHtml escapes the user text', () => {
  const html = bioHtml(check({ ...form, title: { text: '<b>', fonts: ['syne', 'mono'] } }));
  assert.match(html, /<span>&#60;<\/span><span>b<\/span><span>&#62;<\/span>/);
  assert.match(html, /<span class="custom-hello">¡Hola!<\/span>/);
});

test('save, serve, edit with the key only', async () => {
  const res = await configs.POST(req('/api/configs', 'POST', form));
  assert.equal(res.status, 201);
  const { id, key, bio, link } = await res.json();
  assert.match(bio, /custom-title/);
  assert.equal(link, `@import url("https://x.test/c/${id}.css");`);

  const served = await css.GET(req(`/api/css?file=${id}.css`));
  assert.equal(served.status, 200);
  assert.equal(served.headers.get('cache-control'), 'no-store');
  assert.match(await served.text(), /--gold:#ffc857/);

  assert.equal((await configs.GET(req(`/api/configs?id=${id}`, 'GET', null, 'wrong'))).status, 404);
  assert.equal((await configs.PUT(req(`/api/configs?id=${id}`, 'PUT', { ...form, accent: '#000000' }, 'wrong'))).status, 404);
  assert.equal((await configs.PUT(req(`/api/configs?id=${id}`, 'PUT', { ...form, accent: '#123456' }, key))).status, 200);
  assert.deepEqual((await (await configs.GET(req(`/api/configs?id=${id}`, 'GET', null, key))).json()).form.accent, '#123456');
  assert.equal((await configs.PUT(req(`/api/configs?id=${id}`, 'PUT', { ...form, accent: '#123456', css: '.custom-x{color:red}' }, key))).status, 200);
  const updated = await (await css.GET(req(`/api/css?file=${id}.css`))).text();
  assert.match(updated, /--gold:#123456/);
  assert.ok(updated.endsWith('.custom-x{color:red}' + String.fromCharCode(10)));

  assert.equal((await css.GET(req('/api/css?file=nope.css'))).status, 404);
  assert.equal((await configs.POST(req('/api/configs', 'POST', { accent: 'x' }))).status, 400);
});
