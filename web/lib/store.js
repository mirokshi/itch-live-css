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
  return {
    read: async (k) => data.get(k) ?? null,
    async write(k, value) {
      data.set(k, value);
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, JSON.stringify(Object.fromEntries(data)));
    },
  };
}

const { read, write } =
  REDIS_URL && TOKEN
    ? {
        async read(k) {
          const value = await redis('GET', k);
          return value === null ? null : JSON.parse(value);
        },
        async write(k, value) {
          await redis('SET', k, JSON.stringify(value));
        },
      }
    : fileStore();

export const get = (id) => read(`config:${id}`);
export const set = (id, value) => write(`config:${id}`, value);
// shortcut: one list read and written whole (no locking); fine for a hand-moderated list of a few
// hundred entries, move to a Redis hash if it grows or saves collide
export const getShowcase = async () => (await read('meta:showcase')) ?? [];
export const setShowcase = (list) => write('meta:showcase', list);
