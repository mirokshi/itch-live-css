import { PAGE_NAMES, thumb } from './thumb.js';

const list = document.getElementById('list');
const status = document.getElementById('status');
const LABELS = { pending: 'Pendiente', approved: 'Aprobado', rejected: 'Rechazado' };
let key = '';
try {
  key = sessionStorage.getItem('admin-key') ?? '';
} catch {}

async function call(method, body) {
  const res = await fetch(method === 'GET' ? '/api/showcase?all=1' : '/api/showcase', {
    method,
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: body && JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
  return data;
}

// Every entry with its preview and the three decisions. Names and URLs come from users: textContent.
async function load() {
  const { entries } = await call('GET');
  status.textContent = `${entries.length} solicitudes, ${entries.filter((e) => e.status === 'pending').length} pendientes.`;
  list.replaceChildren();
  for (const e of entries) {
    const li = Object.assign(document.createElement('li'), { className: 'card' });
    const box = Object.assign(document.createElement('div'), { className: 'thumb' });
    const body = Object.assign(document.createElement('div'), { className: 'body' });
    body.append(
      Object.assign(document.createElement('h2'), { textContent: e.name || '(sin nombre)' }),
      Object.assign(document.createElement('p'), { textContent: `${PAGE_NAMES[e.page] ?? e.page} · ${LABELS[e.status]} · ${new Date(e.at).toLocaleDateString('es')}` }),
      Object.assign(document.createElement('a'), { href: e.url, textContent: e.url, rel: 'noopener', target: '_blank' }),
    );
    const actions = Object.assign(document.createElement('div'), { className: 'actions' });
    for (const [s, label] of [['approved', 'Aprobar'], ['rejected', 'Rechazar'], ['pending', 'Dejar pendiente']]) {
      if (s === e.status) continue;
      const b = Object.assign(document.createElement('button'), { type: 'button', textContent: label, className: s === 'approved' ? '' : 'ghost' });
      b.addEventListener('click', async () => {
        await call('POST', { id: e.id, status: s });
        await load();
      });
      actions.append(b);
    }
    body.append(actions);
    li.append(box, body);
    list.append(li);
    fetch(`/c/${e.id}.css`).then((r) => (r.ok ? r.text() : '')).then((css) => thumb(box, { page: e.page, css }));
  }
}

document.getElementById('login').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  key = document.getElementById('key').value;
  try {
    await load();
    try {
      sessionStorage.setItem('admin-key', key);
    } catch {}
  } catch (err) {
    status.textContent = `No se pudo entrar: ${err.message}`;
  }
});
if (key) load().catch((err) => (status.textContent = err.message));
