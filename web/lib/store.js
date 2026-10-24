// Saved configs by id: get(id) → value | null, set(id, value).
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
const key = (id) => `config:${id}`;

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
    data = new Map(Object.entries(JSON.parse(readFileSync(file, 'utf8'))));
  } catch {
    data = new Map();
  }
  return {
    get: async (id) => data.get(id) ?? null,
    async set(id, value) {
      data.set(id, value);
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, JSON.stringify(Object.fromEntries(data)));
    },
  };
}

export const { get, set } =
  REDIS_URL && TOKEN
    ? {
        async get(id) {
          const value = await redis('GET', key(id));
          return value === null ? null : JSON.parse(value);
        },
        async set(id, value) {
          await redis('SET', key(id), JSON.stringify(value));
        },
      }
    : fileStore();
