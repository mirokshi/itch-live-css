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
  if (String(url).startsWith('https://fonts.googleapis.com/css2?')) {
    if (String(url).includes('Inter')) return new Response('nope', { status: 500 }); // Google failing
    return new Response('/* latin */\n@font-face {\n  font-family: "Syne";\n  src: url(https://fonts.gstatic.com/s/syne/v1/a.woff2) format("woff2");\n}\n', { headers: { 'Content-Type': 'text/css; charset=utf-8' } });
  }
  if (String(url) === 'https://api.itch.io/profile/games') {
    itchCalls++;
    return Response.json({ games: [{ id: 2660825, published: true, views_count: 1840, downloads_count: 0, published_at: '2024-03-02T10:00:00Z' }] });
  }
  throw new Error(`unexpected fetch: ${url}`);
};

const { GET } = await import('../api/css.js');
const configs = await import('../api/configs.js');
const { check, pluginList } = await import('../lib/config.js');
const { FONTS } = await import('../public/fonts.js');

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

test('Google Fonts are inlined after the imports that stay, or kept as an @import if Google fails', async () => {
  const css = '@import url("https://x.test/other.css");\n#wrapper{color:red}';
  db.set('config:fonts123', JSON.stringify({ form: check({ accent: '#ffc857', css, title: { text: 'Ab', fonts: ['syne', 'hand'] } }) }));
  db.set('config:fontsbad', JSON.stringify({ form: check({ accent: '#ffc857', css, title: { text: 'Ab', fonts: ['inter', 'mono'] } }) }));
  const ok = await (await get('fonts123')).text();
  assert.ok(ok.startsWith('@import url("https://x.test/other.css");\n@font-face{font-family:"Syne";'));
  assert.doesNotMatch(ok, /fonts\.googleapis/);
  const bad = await (await get('fontsbad')).text();
  assert.match(bad.split('\n')[0], /^@import url\("https:\/\/fonts\.googleapis\.com\/css2\?family=Inter/);
  assert.equal(bad.split('\n')[1], '@import url("https://x.test/other.css");');
});

test('PAUSED stops serving and saving; BLOCKED_IDS stops one config', async () => {
  process.env.PAUSED = '1';
  try {
    assert.equal((await get('other123')).status, 503);
    assert.equal((await configs.POST(new Request('https://x.test/api/configs', { method: 'POST', body: '{}' }))).status, 503);
  } finally {
    delete process.env.PAUSED;
  }
  process.env.BLOCKED_IDS = 'zzzzzzzz,other123';
  try {
    assert.equal((await get('other123')).status, 410);
    assert.equal((await get('stale123')).status, 200);
  } finally {
    delete process.env.BLOCKED_IDS;
  }
});

test("the owner's form gives the engine's owner config", () => {
  const greeting = engineOwner.plugins.find((p) => p.use === 'greeting').options;
  const owner = check({
    accent: '#ffc857',
    // what the form sends with these three ticked: FONTS order, which cycles into the owner's 3/3/2
    title: { text: 'Mirokshi', fonts: Object.keys(FONTS).filter((k) => ['hand', 'playfair', 'syne'].includes(k)) },
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
