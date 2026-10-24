import { FONTS } from './fonts.js';

const form = document.getElementById('form');
const frame = document.getElementById('preview');
const stage = document.querySelector('.stage');
const status = document.getElementById('status');
const DEFAULT_FONTS = ['fraunces', 'inter', 'grotesk'];
const SAMPLE_BIO = '<p>Hago juegos pequeños. Este es un perfil de ejemplo.</p>';

document.getElementById('fonts').innerHTML = Object.entries(FONTS)
  .map(([k, f]) => `<label><input type="checkbox" name="title_font" value="${k}"${DEFAULT_FONTS.includes(k) ? ' checked' : ''}> ${f.name}</label>`)
  .join('');

// Code editors over the two textareas (CodeMirror 5, loaded from cdnjs in index.html).
const dark = matchMedia('(prefers-color-scheme: dark)');
const editor = (id, mode) =>
  CodeMirror.fromTextArea(document.getElementById(id), { mode, lineNumbers: true, lineWrapping: true, theme: dark.matches ? 'material-darker' : 'default' });
const cssEditor = editor('css', 'css');
const htmlEditor = editor('html', 'htmlmixed');
dark.addEventListener('change', () => {
  for (const ed of [cssEditor, htmlEditor]) ed.setOption('theme', dark.matches ? 'material-darker' : 'default');
});

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
    css: cssEditor.getValue(),
    html: htmlEditor.getValue(),
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
  cssEditor.setValue(f.css ?? '');
  htmlEditor.setValue(f.html ?? '');
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

// What itch's sanitizer keeps of a bio (knowledge base §5): no scripts or styles, classes only if
// they start with "custom", no id, data-*, aria-* or role. The iframe has no allow-scripts anyway.
function itchSanitize(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll('script, style, link, meta, object, embed, form, input, button, select, textarea').forEach((e) => e.remove());
  for (const el of doc.body.querySelectorAll('*')) {
    for (const { name } of [...el.attributes]) {
      if (name === 'class') {
        const keep = [...el.classList].filter((c) => c.startsWith('custom'));
        if (keep.length) el.setAttribute('class', keep.join(' '));
        else el.removeAttribute('class');
      } else if (name === 'id' || name === 'role' || /^(on|data-|aria-)/.test(name)) el.removeAttribute(name);
    }
  }
  return doc.body.innerHTML;
}

// The preview iframe is same-origin: the CSS and the bio go straight into its DOM.
// · effects (server, random): style#live — behind a loading screen, so the swap doesn't jump;
// · the user's CSS and HTML: style#custom_css and the bio, at once, without re-rolling the effects.
const doc = () => frame.contentDocument;
let effectsBio = '';

function applyUser() {
  const { css, html } = readForm();
  doc().getElementById('custom_css').textContent = css;
  doc().getElementById('bio').innerHTML = html.trim() ? itchSanitize(html) : effectsBio + SAMPLE_BIO;
}

let timer;
let generation = 0;
function refreshEffects() {
  clearTimeout(timer);
  stage.classList.add('is-loading');
  timer = setTimeout(async () => {
    const mine = ++generation;
    try {
      const { css, bio } = await api('/api/preview', 'POST', { ...readForm(), css: '', html: '' });
      if (mine !== generation) return; // a newer change is already on its way
      doc().getElementById('live').textContent = css;
      effectsBio = bio;
      applyUser();
      await doc().fonts.ready;
      status.textContent = '';
    } catch (err) {
      status.textContent = err.message;
    }
    if (mine === generation) stage.classList.remove('is-loading');
  }, 300);
}

let userTimer;
const refreshUser = () => {
  clearTimeout(userTimer);
  userTimer = setTimeout(applyUser, 200);
};

function showResult({ bio, link }) {
  document.getElementById('out-link').value = link;
  document.getElementById('out-bio').value = bio;
  document.getElementById('bio-box').hidden = !bio;
  document.getElementById('out-edit').value = `${location.origin}/#edit=${saved.id}.${saved.key}`;
  document.getElementById('result').hidden = false;
}

// the editors' own hidden inputs also fire "input": they only touch the user's CSS and HTML
form.addEventListener('input', (e) => e.target.closest('.CodeMirror') || refreshEffects());
cssEditor.on('change', refreshUser);
htmlEditor.on('change', refreshUser);

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
if (doc()?.readyState === 'complete' && doc().getElementById('bio')) refreshEffects();
else frame.addEventListener('load', refreshEffects, { once: true });
