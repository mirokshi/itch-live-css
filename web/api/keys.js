// /api/keys — an encrypted copy of a user's edit keys, so they can get them back with email + password.
//   PUT    ?id=…  + Bearer auth  body: { blob }  → { ok }   (creates it, or replaces it when auth matches)
//   GET    ?id=…  + Bearer auth                  → { blob }
//   DELETE ?id=…  + Bearer auth                  → { ok }
// The browser derives id, auth and the AES key from email + password (src/keychain.js) and encrypts
// the keys itself: this server never sees the email, the password or a readable key. It stores a hash
// of auth and the blob. Unknown id and wrong auth give the same 404.
// shortcut: no rate limit on creating copies (64 KB each); add one if the store ever fills with junk.

import { createHash, timingSafeEqual } from 'node:crypto';
import { BadRequest, handle, json, readJson } from '../lib/http.js';
import * as store from '../lib/store.js';

const MAX_BLOB = 64 * 1024; // characters of base64url
const hash = (auth) => createHash('sha256').update(auth).digest();
const notFound = () => json({ error: 'no copy for that email and password' }, 404);
const paused = () => process.env.PAUSED && json({ error: 'saving is paused for now' }, 503);

// → { id, auth, rec } when the id and the Bearer auth are well formed; rec is null if nothing is stored
async function lookup(request) {
  const id = new URL(request.url).searchParams.get('id') ?? '';
  const auth = (request.headers.get('authorization') ?? '').replace(/^Bearer /, '');
  if (!/^[\w-]{22}$/.test(id) || !/^[\w-]{43}$/.test(auth)) throw new BadRequest('bad id or auth');
  return { id, auth, rec: await store.getBackup(id) };
}
const matches = ({ auth, rec }) => rec && timingSafeEqual(hash(auth), Buffer.from(rec.authHash, 'base64'));

export const PUT = (request) =>
  handle(async () => {
    if (paused()) return paused();
    const k = await lookup(request);
    if (k.rec && !matches(k)) return notFound();
    const { blob } = await readJson(request);
    if (typeof blob !== 'string' || !/^[\w-]+$/.test(blob) || blob.length > MAX_BLOB) throw new BadRequest('bad blob');
    await store.setBackup(k.id, { authHash: hash(k.auth).toString('base64'), blob });
    return json({ ok: true });
  });

export const GET = (request) =>
  handle(async () => {
    const k = await lookup(request);
    return matches(k) ? json({ blob: k.rec.blob }) : notFound();
  });

export const DELETE = (request) =>
  handle(async () => {
    const k = await lookup(request);
    if (!matches(k)) return notFound();
    await store.delBackup(k.id);
    return json({ ok: true });
  });
