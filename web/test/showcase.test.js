import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

process.env.FAKE_STORE = join(mkdtempSync(join(tmpdir(), 'itch-live-css-')), 'store.json');
process.env.ADMIN_KEY = 'admin-secret';
const { check } = await import('../lib/config.js');
const configs = await import('../api/configs.js');
const showcase = await import('../api/showcase.js');

const req = (path, method = 'GET', body, key) =>
  new Request(`https://x.test${path}`, { method, body: body && JSON.stringify(body), headers: key ? { Authorization: `Bearer ${key}` } : {} });
const form = { accent: '#d6336c', css: '#wrapper .custom-x{color:red}', showcase: { url: 'https://someone.itch.io/', name: 'Someone' } };
const publicList = async () => (await (await showcase.GET(req('/api/showcase'))).json()).entries;

test('check: the showcase takes an itch.io page on https only', () => {
  assert.deepEqual(check(form).showcase, { url: 'https://someone.itch.io/', name: 'Someone' });
  for (const url of ['http://someone.itch.io/', 'https://evil.com/', 'https://someone.itch.io.evil.com/', 'javascript:alert(1)', 'https://a.itch.io/"x']) {
    assert.throws(() => check({ ...form, showcase: { url } }), /showcase/, url);
  }
  assert.throws(() => check({ ...form, showcase: { url: 'https://a.itch.io/', name: 'x'.repeat(41) } }), /name/);
});

test('showcase: pending until an admin approves; a changed address goes back to pending', async () => {
  const { id, key, showcase: status } = await (await configs.POST(req('/api/configs', 'POST', form))).json();
  assert.equal(status, 'pending');
  assert.deepEqual(await publicList(), []);

  assert.equal((await showcase.GET(req('/api/showcase?all=1'))).status, 403);
  assert.equal((await showcase.POST(req('/api/showcase', 'POST', { id, status: 'approved' }, 'wrong'))).status, 403);
  assert.equal((await showcase.POST(req('/api/showcase', 'POST', { id, status: 'approved' }, 'admin-secret'))).status, 200);
  assert.deepEqual(await publicList(), [{ id, url: 'https://someone.itch.io/', name: 'Someone', page: 'profile' }]);

  // a CSS edit keeps the approval; a new address needs a new one
  const put = (f) => configs.PUT(req(`/api/configs?id=${id}`, 'PUT', f, key)).then((r) => r.json());
  assert.equal((await put({ ...form, css: '#wrapper{color:blue}' })).showcase, 'approved');
  assert.equal((await put({ ...form, showcase: { url: 'https://someone.itch.io/game' } })).showcase, 'pending');
  assert.deepEqual(await publicList(), []);

  // opting out removes the entry
  assert.equal((await put({ ...form, showcase: null })).showcase, null);
  const all = await (await showcase.GET(req('/api/showcase?all=1', 'GET', null, 'admin-secret'))).json();
  assert.equal(all.entries.length, 0);
  assert.equal((await showcase.POST(req('/api/showcase', 'POST', { id, status: 'nope' }, 'admin-secret'))).status, 400);
});
