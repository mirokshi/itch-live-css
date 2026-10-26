// /c/<id>.css against a fake Upstash and a fake itch API (both through fetch), and the owner's
// profile as a web form.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { config as engineOwner } from '../../engine/test/mirokshi.js';

process.env.UPSTASH_REDIS_REST_URL = 'https://redis.test';
process.env.UPSTASH_REDIS_REST_TOKEN = 'token';
process.env.ITCH_API_KEY = 'key';
process.env.ITCH_OWNER_ID = 'owner123';

const db = new Map();
let storeDown = false;
let itchCalls = 0;
globalThis.fetch = async (url, opts) => {
  if (String(url) === 'https://redis.test') {
    if (storeDown) throw new Error('store timeout');
    const [cmd, k, v] = JSON.parse(opts.body);
    if (cmd === 'SET') db.set(k, v);
    return Response.json({ result: cmd === 'GET' ? db.get(k) ?? null : 'OK' });
  }
  if (String(url) === 'https://api.itch.io/profile/games') {
    itchCalls++;
    return Response.json({ games: [{ id: 2660825, published: true, views_count: 1840, downloads_count: 0, published_at: '2024-03-02T10:00:00Z' }] });
  }
  throw new Error(`unexpected fetch: ${url}`);
};

const { GET } = await import('../api/css.js');
const { check, pluginList } = await import('../lib/config.js');

const form = check({ accent: '#ffc857', cards: true });
for (const id of ['owner123', 'other123', 'stale123']) db.set(`config:${id}`, JSON.stringify({ form }));
const get = (id) => GET(new Request(`https://x.test/api/css?file=${id}.css`));

test("itch's data goes to the owner's config only", async () => {
  assert.match(await (await get('owner123')).text(), /data-game_id="2660825"/);
  assert.doesNotMatch(await (await get('other123')).text(), /data-game_id/);
  await get('owner123');
  assert.equal(itchCalls, 1); // kept for an hour
});

test('configs come from memory, and from the last copy when the store fails', async () => {
  assert.equal((await get('stale123')).status, 200);
  storeDown = true;
  try {
    assert.equal((await get('stale123')).status, 200); // within the minute: no store read
    const now = Date.now;
    Date.now = () => now() + 2 * 60 * 1000;
    try {
      assert.equal((await get('stale123')).status, 200); // read fails: last copy
    } finally {
      Date.now = now;
    }
    assert.equal((await get('never123')).status, 503); // nothing kept: fail fast, the pasted CSS shows
  } finally {
    storeDown = false;
  }
  assert.equal((await get('never123')).status, 404);
});

test("the owner's form gives the engine's owner config", () => {
  const greeting = engineOwner.plugins.find((p) => p.use === 'greeting').options;
  const owner = check({
    accent: '#ffc857',
    // fonts cycle along the letters: this order gives the owner's 3 Syne, 2 Edu Hand, 3 Playfair
    title: { text: 'Mirokshi', fonts: ['syne', 'playfair', 'hand'] },
    greeting: { first: greeting.first, others: greeting.others },
    cards: true,
    ascii: true,
  });
  // the bag's order doesn't matter (it's shuffled), and font-size:1em on a letter is a no-op
  const norm = (plugins) =>
    plugins.map(({ use, options = {} }) =>
      use === 'title' ? { use, bag: options.bag.map((k) => options.fonts[k].replace(';font-size:1em', '')).sort() } : { use, options },
    );
  assert.deepEqual(norm(pluginList(owner)), norm(engineOwner.plugins));
});
