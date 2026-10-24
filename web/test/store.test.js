import assert from 'node:assert/strict';
import { test } from 'node:test';

test('Upstash: REST commands with the token, JSON values, null when missing', async () => {
  process.env.KV_REST_API_URL = 'https://redis.example';
  process.env.KV_REST_API_TOKEN = 'secret';
  // a stand-in for Upstash's REST API: POST a JSON command array, get { result }
  const db = new Map();
  const seen = [];
  globalThis.fetch = async (url, { headers, body }) => {
    const [cmd, k, v] = JSON.parse(body);
    seen.push([url, headers.Authorization, cmd, k]);
    if (cmd === 'SET') db.set(k, v);
    return Response.json({ result: cmd === 'GET' ? (db.get(k) ?? null) : 'OK' });
  };
  const store = await import('../lib/store.js?upstash'); // fresh instance that sees the env vars

  assert.equal(await store.get('abcdefgh'), null);
  await store.set('abcdefgh', { form: { accent: '#ffc857' }, keyHash: 'x' });
  assert.deepEqual(await store.get('abcdefgh'), { form: { accent: '#ffc857' }, keyHash: 'x' });
  assert.deepEqual(seen[1], ['https://redis.example', 'Bearer secret', 'SET', 'config:abcdefgh']);

  globalThis.fetch = async () => Response.json({ error: 'WRONGPASS' }, { status: 401 });
  await assert.rejects(store.get('abcdefgh'), /WRONGPASS/);
});
