import { FONTS } from './fonts.js';

const form = document.getElementById('form');
const frame = document.getElementById('preview');
const status = document.getElementById('status');
const DEFAULT_FONTS = ['syne', 'hand', 'playfair'];

document.getElementById('fonts').innerHTML = Object.entries(FONTS)
  .map(([k, f]) => `<label><input type="checkbox" name="title_font" value="${k}"${DEFAULT_FONTS.includes(k) ? ' checked' : ''}> ${f.name}</label>`)
  .join('');

// The edit link carries "id.key" in the fragment, so the key never reaches a server log or a Referer.
const [id, key] = (location.hash.match(/^#edit=([\w-]+)\.([\w-]+)$/) ?? []).slice(1);
let saved = id ? { id, key } : null;

function readForm() {
  const d = new FormData(form);
  return {
    accent: d.get('accent'),
    title: d.has('title_on') ? { text: d.get('title_text'), fonts: d.getAll('title_font') } : null,
    greeting: d.has('greeting_on')
      ? { first: d.get('greeting_first'), others: d.get('greeting_others').split('\n').map((s) => s.trim()).filter(Boolean) }
      : null,
    cards: d.has('cards'),
    ascii: d.has('ascii'),
    reserve: Number(d.get('reserve')),
  };
}

function fillForm(f) {
  const el = form.elements;
  el.accent.value = f.accent;
  el.title_on.checked = !!f.title;
  if (f.title) {
    el.title_text.value = f.title.text;
    for (const box of el.title_font) box.checked = f.title.fonts.includes(box.value);
  }
  el.greeting_on.checked = !!f.greeting;
  if (f.greeting) {
    el.greeting_first.value = f.greeting.first;
    el.greeting_others.value = f.greeting.others.join('\n');
  }
  el.cards.checked = f.cards;
  el.ascii.checked = f.ascii;
  el.reserve.value = f.reserve;
}

async function api(path, method, body, auth) {
  const res = await fetch(path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(auth && { Authorization: `Bearer ${auth}` }) },
    body: body && JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
  return data;
}

// The preview iframe is same-origin: the CSS and the bio go straight into its DOM.
let timer;
function refresh() {
  clearTimeout(timer);
  timer = setTimeout(async () => {
    try {
      const { css, bio } = await api('/api/preview', 'POST', readForm());
      const doc = frame.contentDocument;
      doc.getElementById('custom_css').textContent = css;
      doc.getElementById('bio').innerHTML = bio + '<p>Hago juegos pequeños y raros. Este es mi perfil de ejemplo.</p>';
      status.textContent = '';
    } catch (err) {
      status.textContent = err.message;
    }
  }, 250);
}

const NAMES = { title: 'el título', greeting: 'el saludo', cards: 'las tarjetas', ascii: 'el campo ASCII' };
const list = (uses) => uses.map((u) => NAMES[u]).join(', ');

// exported: { bio, paste: { css, size, included, left } } from /api/configs
function showResult({ bio, paste }) {
  document.getElementById('out-paste').value = paste.css;
  document.getElementById('out-bio').value = bio;
  const { bytes, limit } = paste.size;
  document.getElementById('out-size').textContent =
    `Ocupa ${bytes.toLocaleString('es')} de ${limit.max.toLocaleString('es')} bytes; te quedan ${(limit.max - bytes).toLocaleString('es')} para tu CSS. ` +
    (paste.included.length ? `Si el link falla, se sigue viendo ${list(paste.included)}. ` : '') +
    (paste.left.length ? `Solo por el link (no caben en el tope): ${list(paste.left)}.` : '');
  document.getElementById('out-edit').value = `${location.origin}/#edit=${saved.id}.${saved.key}`;
  document.getElementById('result').hidden = false;
}

form.addEventListener('input', refresh);
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const config = readForm();
    let exported;
    if (saved) exported = await api(`/api/configs?id=${saved.id}`, 'PUT', config, saved.key);
    else {
      exported = await api('/api/configs', 'POST', config);
      saved = { id: exported.id, key: exported.key };
      history.replaceState(null, '', `#edit=${saved.id}.${saved.key}`);
    }
    showResult(exported);
    status.textContent = 'Guardado.';
  } catch (err) {
    status.textContent = err.message;
  }
});

form.addEventListener('click', async (e) => {
  const target = e.target.dataset.copy;
  if (!target) return;
  await navigator.clipboard.writeText(document.getElementById(target).value);
  e.target.textContent = 'Copiado';
  setTimeout(() => (e.target.textContent = 'Copiar'), 1500);
});

if (saved) {
  try {
    const exported = await api(`/api/configs?id=${saved.id}`, 'GET', null, saved.key);
    fillForm(exported.form);
    showResult(exported);
  } catch (err) {
    saved = null;
    status.textContent = `No se pudo abrir ese enlace de edición: ${err.message}`;
  }
}
if (frame.contentDocument?.readyState === 'complete' && frame.contentDocument.getElementById('bio')) refresh();
else frame.addEventListener('load', refresh);
