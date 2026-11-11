// Saved data: configs by id, get(id) → value | null and set(id, value), and the showcase list,
// getShowcase() → [entry] and setShowcase([entry]). Keys: config:<id> and meta:showcase.
// · On Vercel: Upstash Redis through its REST API. The Marketplace integration creates the env
//   vars as UPSTASH_REDIS_REST_* or KV_REST_API_*, depending on the setup; both are read.
// · Without them (local dev, tests): a JSON file, so configs survive the dev server's restarts.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
// Vercel's file system is read-only: without Redis every save would fail, so say why up front.
if (process.env.VERCEL && !(REDIS_URL && TOKEN)) throw new Error('store: no Upstash Redis env vars on Vercel');

// ms; /c/<id>.css waits on this, and a hanging @import blanks the page: better to fail fast and let
// the pasted copy show
const TIMEOUT = 2000;

async function redis(...command) {
  const res = await fetch(REDIS_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify(command),
    signal: AbortSignal.timeout(TIMEOUT),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.error) throw new Error(`store: Upstash ${command[0]} failed: ${body.error ?? res.status}`);
  return body.result;
}

function fileStore() {
  const file = process.env.FAKE_STORE ?? fileURLToPath(new URL('../.data/store.json', import.meta.url));
  let data;
  try {
    // files from before the showcase keyed configs by bare id
    data = new Map(Object.entries(JSON.parse(readFileSync(file, 'utf8'))).map(([k, v]) => [k.includes(':') ? k : `config:${k}`, v]));
  } catch {
    data = new Map();
  }
  const save = () => {
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, JSON.stringify(Object.fromEntries(data)));
  };
  return {
    read: async (k) => data.get(k) ?? null,
    async write(k, value) {
      data.set(k, value);
      save();
    },
    async remove(k) {
      data.delete(k);
      save();
    },
  };
}

const { read, write, remove } =
  REDIS_URL && TOKEN
    ? {
        async read(k) {
          const value = await redis('GET', k);
          return value === null ? null : JSON.parse(value);
        },
        async write(k, value) {
          await redis('SET', k, JSON.stringify(value));
        },
        async remove(k) {
          await redis('DEL', k);
        },
      }
    : fileStore();

export const get = (id) => read(`config:${id}`);
export async function set(id, value) {
  await write(`config:${id}`, value);
  memory.set(id, { value, at: Date.now() });
  misses.delete(id);
}

// For /c/<id>.css: a config from memory, read again at most once a minute per instance, and the
// last copy when the store fails (a hanging @import blanks the page, knowledge base §8). A save on
// this instance refreshes it at once; on other instances an edit shows within the minute.
const TTL = 60 * 1000;
const memory = new Map(); // id → { value, at }; only configs that exist, so made-up ids can't fill it
// Unknown ids are remembered for the same minute, so a dead link on a busy page asks the store once
// a minute, not once a visit. Capped: the oldest goes first.
// shortcut: a flood of different made-up ids still reaches the store once each; that needs a rate
// limit on /c/* (Vercel → Firewall), not code here.
const MAX_MISSES = 5000;
const misses = new Map(); // id → at
export async function getCached(id) {
  const kept = memory.get(id);
  if (kept && Date.now() - kept.at < TTL) return kept.value;
  if (Date.now() - misses.get(id) < TTL) return null;
  try {
    const value = await get(id);
    if (value) memory.set(id, { value, at: Date.now() });
    else {
      misses.delete(id); // back of the line
      misses.set(id, Date.now());
      if (misses.size > MAX_MISSES) misses.delete(misses.keys().next().value);
    }
    return value;
  } catch (err) {
    if (kept) return kept.value;
    throw err;
  }
}
// Encrypted copies of a user's edit keys (api/keys.js): keys:<id>, opaque to the server.
export const getBackup = (id) => read(`keys:${id}`);
export const setBackup = (id, value) => write(`keys:${id}`, value);
export const delBackup = (id) => remove(`keys:${id}`);

// shortcut: one list read and written whole (no locking); fine for a hand-moderated list of a few
// hundred entries, move to a Redis hash if it grows or saves collide
export const getShowcase = async () => (await read('meta:showcase')) ?? [];
export const setShowcase = (list) => write('meta:showcase', list);
