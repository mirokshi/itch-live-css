import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

process.env.FAKE_STORE = join(mkdtempSync(join(tmpdir(), 'itch-live-css-')), 'store.json');
const keychain = await import('../src/keychain.js');
const keys = await import('../api/keys.js');

const entries = [
  { id: 'abcd1234', key: 'k_-9', page: 'profile', name: 'Mi perfil' },
  { id: 'efgh5678', key: 'zZ0', page: 'project', name: '' },
];

test('text file: toText → parseText returns the same entries', () => {
  const text = keychain.toText(entries, 'https://x.test');
  assert.match(text, /^https:\/\/x\.test\/#edit=abcd1234\.k_-9 {2}profile {2}Mi perfil\n/);
  assert.deepEqual(keychain.parseText(text), entries);
  // bare links, CRLF and noise are fine
  assert.deepEqual(keychain.parseText('hola\r\n#edit=abcd1234.k_-9\r\n'), [{ id: 'abcd1234', key: 'k_-9', page: '', name: '' }]);
});

test('merge: by id, a name already set is kept', () => {
  const merged = keychain.merge([{ id: 'abcd1234', key: 'new', page: 'profile', name: '' }], entries);
  assert.equal(merged.length, 2);
  assert.deepEqual(merged.find((e) => e.id === 'abcd1234'), { id: 'abcd1234', key: 'new', page: 'profile', name: 'Mi perfil' });
});

test('seal/open: the same email + password opens it, another does not; email case and spaces do not matter', async () => {
  const a = await keychain.derive(' Ana@Example.com ', 'correct horse battery');
  const blob = await keychain.seal(entries, a.aes);
  assert.deepEqual(await keychain.open(blob, a.aes), entries);

  const same = await keychain.derive('ana@example.com', 'correct horse battery');
  assert.equal(same.id, a.id);
  assert.deepEqual(await keychain.open(blob, same.aes), entries);

  const other = await keychain.derive('ana@example.com', 'another password!');
  assert.notEqual(other.id, a.id);
  assert.notEqual(other.auth, a.auth);
  await assert.rejects(keychain.open(blob, other.aes));
});

const req = (id, auth, method = 'GET', body) =>
  new Request(`https://x.test/api/keys?id=${id}`, { method, body: body && JSON.stringify(body), headers: auth ? { Authorization: `Bearer ${auth}` } : {} });

test('api/keys: create, read, replace, wrong auth looks like nothing, delete', async () => {
  const a = await keychain.derive('ana@example.com', 'correct horse battery');
  const b = await keychain.derive('ben@example.com', 'correct horse battery');
  const blob = await keychain.seal(entries, a.aes);

  assert.equal((await keys.GET(req(a.id, a.auth))).status, 404);
  assert.equal((await keys.PUT(req(a.id, a.auth, 'PUT', { blob }))).status, 200);
  assert.deepEqual(await (await keys.GET(req(a.id, a.auth))).json(), { blob });

  // someone who knows the id but not the auth can neither read, replace nor delete it
  assert.equal((await keys.GET(req(a.id, b.auth))).status, 404);
  assert.equal((await keys.PUT(req(a.id, b.auth, 'PUT', { blob: 'AAAA' }))).status, 404);
  assert.equal((await keys.PUT(new Request(`https://x.test/api/keys?id=${a.id}`, { method: 'PUT', body: 'null', headers: { Authorization: `Bearer ${a.auth}` } }))).status, 400);
  assert.equal((await keys.DELETE(req(a.id, b.auth, 'DELETE'))).status, 404);
  assert.deepEqual(await (await keys.GET(req(a.id, a.auth))).json(), { blob });

  const blob2 = await keychain.seal(entries.slice(0, 1), a.aes);
  assert.equal((await keys.PUT(req(a.id, a.auth, 'PUT', { blob: blob2 }))).status, 200);
  assert.deepEqual(await keychain.open((await (await keys.GET(req(a.id, a.auth))).json()).blob, a.aes), entries.slice(0, 1));

  assert.equal((await keys.DELETE(req(a.id, a.auth, 'DELETE'))).status, 200);
  assert.equal((await keys.GET(req(a.id, a.auth))).status, 404);
});

test('api/keys: malformed ids, auth and blobs are 400', async () => {
  const a = await keychain.derive('ana@example.com', 'correct horse battery');
  assert.equal((await keys.GET(req('short', a.auth))).status, 400);
  assert.equal((await keys.GET(req(a.id, 'short'))).status, 400);
  assert.equal((await keys.PUT(req(a.id, a.auth, 'PUT', { blob: 'not base64url!' }))).status, 400);
  assert.equal((await keys.PUT(req(a.id, a.auth, 'PUT', { blob: 'A'.repeat(64 * 1024 + 1) }))).status, 400);
  assert.equal((await keys.PUT(req(a.id, a.auth, 'PUT', {}))).status, 400);
});
