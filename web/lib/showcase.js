// The showcase: pages whose owners asked to appear (form.showcase) and an admin approved.
// entry: { id, url, name, page, status: 'pending' | 'approved' | 'rejected', at }

import { createHash, timingSafeEqual } from 'node:crypto';
import * as store from './store.js';

export const STATUSES = ['pending', 'approved', 'rejected'];

// After a save: add, update or drop the config's entry. A changed address, name or page type goes
// back to pending, so what an admin approved is what is shown.
// shortcut: CSS edits keep the approval; re-review them if the showcase gets abused.
export async function sync(id, form) {
  const list = await store.getShowcase();
  const old = list.find((e) => e.id === id);
  if (!form.showcase && !old) return null;
  const rest = list.filter((e) => e.id !== id);
  if (!form.showcase) {
    await store.setShowcase(rest);
    return null;
  }
  const { url, name } = form.showcase;
  const same = old && old.url === url && old.name === name && old.page === form.page;
  const entry = { id, url, name, page: form.page, status: same ? old.status : 'pending', at: old?.at ?? Date.now() };
  await store.setShowcase([...rest, entry]);
  return entry.status;
}

export const statusOf = async (id) => (await store.getShowcase()).find((e) => e.id === id)?.status ?? null;

// The admin key is the ADMIN_KEY env var (set by the owner on Vercel). Without it there is no admin.
export function isAdmin(request) {
  const want = process.env.ADMIN_KEY;
  if (!want) return false;
  const got = (request.headers.get('authorization') ?? '').replace(/^Bearer /, '');
  const h = (s) => createHash('sha256').update(s).digest();
  return timingSafeEqual(h(got), h(want));
}
