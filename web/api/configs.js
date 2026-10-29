// /api/configs — saved configs.
//   POST                     body: form → 201 { id, key, ...exports }   (key = the secret edit key)
//   GET  ?id=…   + Bearer key        → { form, ...exports }
//   PUT  ?id=…   + Bearer key  body: form → { ok, ...exports }
// exports: { bio, link, showcase } — the bio HTML the effects need, the @import line for itch's CSS
// field, and the showcase request's status (null, 'pending', 'approved' or 'rejected').
// Only a hash of the key is stored. Unknown id and wrong key give the same 404.

import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { bioHtml, check, linkLine } from '../lib/config.js';
import { handle, json, readJson } from '../lib/http.js';
import * as showcase from '../lib/showcase.js';
import * as store from '../lib/store.js';

const hash = (key) => createHash('sha256').update(key).digest();
const exports = (request, id, form, status) => ({
  bio: bioHtml(form),
  link: linkLine(`${new URL(request.url).origin}/c/${id}.css`),
  showcase: status,
});
const notFound = () => json({ error: 'unknown config or wrong edit key' }, 404);

async function owned(request) {
  const id = new URL(request.url).searchParams.get('id') ?? '';
  const key = (request.headers.get('authorization') ?? '').replace(/^Bearer /, '');
  const rec = /^[\w-]{8}$/.test(id) ? await store.get(id) : null;
  if (!rec || !timingSafeEqual(hash(key), Buffer.from(rec.keyHash, 'base64'))) return null;
  return { id, rec };
}

// PAUSED=1 (Vercel env var, see api/css.js) also stops saving
const paused = () => process.env.PAUSED && json({ error: 'saving is paused for now' }, 503);

export const POST = (request) =>
  handle(async () => {
    if (paused()) return paused();
    const form = check(await readJson(request));
    let id;
    do id = randomBytes(6).toString('base64url'); while (await store.get(id));
    const key = randomBytes(18).toString('base64url');
    await store.set(id, { form, keyHash: hash(key).toString('base64') });
    return json({ id, key, ...exports(request, id, form, await showcase.sync(id, form)) }, 201);
  });

export async function GET(request) {
  const o = await owned(request);
  return o ? json({ form: o.rec.form, ...exports(request, o.id, o.rec.form, await showcase.statusOf(o.id)) }) : notFound();
}

export const PUT = (request) =>
  handle(async () => {
    if (paused()) return paused();
    const o = await owned(request);
    if (!o) return notFound();
    const form = check(await readJson(request));
    await store.set(o.id, { ...o.rec, form });
    return json({ ok: true, ...exports(request, o.id, form, await showcase.sync(o.id, form)) });
  });
