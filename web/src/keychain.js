// The user's edit keys. They live in this browser (localStorage) and, if the user asks, as an
// encrypted copy on the server (api/keys.js) that only email + password can open. Everything secret
// happens here: the server gets a lookup id, an auth token and ciphertext, never the email or password.
//   email + password --PBKDF2-SHA256, 600k rounds--> master --SHA-256(master + label)--> id, auth, AES-GCM key
// An entry is { id, key, page, name }: the config's id, its edit key, its page type and a label.
// shortcut: the password is the only secret, so a weak one can be guessed offline; the page asks for 12+
// characters. Move to a memory-hard KDF (Argon2) if this ever guards more than CSS.

const KEY = 'keychain';
const ITERATIONS = 600_000;
const enc = new TextEncoder();
const subtle = globalThis.crypto.subtle;

const toB64 = (bytes) => {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
};
const fromB64 = (s) => Uint8Array.from(atob(s.replaceAll('-', '+').replaceAll('_', '/')), (c) => c.charCodeAt(0));

// --- the list in this browser ---

export function list() {
  try {
    const got = JSON.parse(localStorage.getItem(KEY));
    return Array.isArray(got) ? got : [];
  } catch {
    return [];
  }
}

function save(entries) {
  try {
    localStorage.setItem(KEY, JSON.stringify(entries));
  } catch {} // private window or blocked storage: the page still works, the list just isn't kept
  return entries;
}

// adds entries by id; for an id already there the new key wins and a name already set is kept
export function merge(incoming, current = list()) {
  const byId = new Map(current.map((e) => [e.id, e]));
  for (const e of incoming) byId.set(e.id, { ...e, name: byId.get(e.id)?.name || e.name || '' });
  return save([...byId.values()]);
}

export const rename = (id, name) => save(list().map((e) => (e.id === id ? { ...e, name } : e)));
export const forget = (id) => save(list().filter((e) => e.id !== id));

// --- the text file: one edit link per line, then the page type and a name ---

export const editLink = (origin, e) => `${origin}/#edit=${e.id}.${e.key}`;

export const toText = (entries, origin) =>
  `${entries.map((e) => [editLink(origin, e), e.page, e.name].filter(Boolean).join('  ')).join('\n')}\n`;

// any text with edit links in it (the file above, or links pasted one per line)
export function parseText(text) {
  const out = [];
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/#edit=([\w-]{8})\.([\w-]+)\s*(profile|project|devlog)?\s*(.*)$/);
    if (m) out.push({ id: m[1], key: m[2], page: m[3] ?? '', name: m[4].trim() });
  }
  return out;
}

// --- the encrypted copy ---

const normalise = (s) => s.normalize('NFKC');

export async function derive(email, password) {
  const salt = enc.encode(`itch-live-css:${normalise(email).trim().toLowerCase()}`);
  const base = await subtle.importKey('raw', enc.encode(normalise(password)), 'PBKDF2', false, ['deriveBits']);
  const master = new Uint8Array(await subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: ITERATIONS }, base, 256));
  const part = async (label) => new Uint8Array(await subtle.digest('SHA-256', new Uint8Array([...master, ...enc.encode(label)])));
  const [id, auth, aes] = await Promise.all(['id', 'auth', 'aes'].map(part));
  return { id: toB64(id.slice(0, 16)), auth: toB64(auth), aes: await subtle.importKey('raw', aes, 'AES-GCM', false, ['encrypt', 'decrypt']) };
}

export async function seal(entries, aes) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new Uint8Array(await subtle.encrypt({ name: 'AES-GCM', iv }, aes, enc.encode(JSON.stringify(entries))));
  return toB64(new Uint8Array([...iv, ...data]));
}

export async function open(blob, aes) {
  const bytes = fromB64(blob);
  const plain = await subtle.decrypt({ name: 'AES-GCM', iv: bytes.slice(0, 12) }, aes, bytes.slice(12));
  return JSON.parse(new TextDecoder().decode(plain));
}

// → the remote entries, or null when nothing is stored for this email + password
async function fetchBackup(k) {
  const res = await fetch(`/api/keys?id=${k.id}`, { headers: { Authorization: `Bearer ${k.auth}` } });
  if (res.status === 404) return null;
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
  return open(data.blob, k.aes);
}

// Gets the copy and merges it into this browser's list. Throws Error('notFound') when there is none.
export async function restore(email, password) {
  const remote = await fetchBackup(await derive(email, password));
  if (!remote) throw new Error('notFound');
  return merge(remote);
}

// Merges what the copy already holds into this browser's list, then stores the whole list encrypted:
// a browser with a shorter list can't wipe a longer copy.
export async function backup(email, password) {
  const k = await derive(email, password);
  const all = merge((await fetchBackup(k)) ?? []);
  const res = await fetch(`/api/keys?id=${k.id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${k.auth}` },
    body: JSON.stringify({ blob: await seal(all, k.aes) }),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `HTTP ${res.status}`);
  return all;
}

export async function deleteBackup(email, password) {
  const k = await derive(email, password);
  const res = await fetch(`/api/keys?id=${k.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${k.auth}` } });
  if (res.status === 404) throw new Error('notFound');
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `HTTP ${res.status}`);
}
