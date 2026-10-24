import { FONTS } from './fonts.js';

const form = document.getElementById('form');
const frame = document.getElementById('preview');
const stage = document.querySelector('.stage');
const status = document.getElementById('status');
const DEFAULT_FONTS = ['fraunces', 'inter', 'grotesk']; // pre-ticked for when the title idea is turned on
const SAMPLE_BIO = '<p>Hago juegos pequeños. Este es un perfil de ejemplo.</p>';

document.getElementById('fonts').innerHTML = Object.entries(FONTS)
  .map(([k, f]) => `<label><input type="checkbox" name="title_font" value="${k}"${DEFAULT_FONTS.includes(k) ? ' checked' : ''}> ${f.name}</label>`)
  .join('');

// The ideas panel (the optional effects): opened from the "Ideas" button, which counts the ones on
// so they aren't forgotten while the panel is closed.
const ideas = document.getElementById('ideas');
const toggle = document.getElementById('ideas-toggle');
function showIdeas(open) {
  ideas.hidden = !open;
  form.classList.toggle('ideas-open', open);
  toggle.setAttribute('aria-expanded', String(open));
  if (open) ideas.scrollIntoView({ block: 'start' }); // on phones the panel sits below the preview
}
toggle.addEventListener('click', () => showIdeas(ideas.hidden));
document.getElementById('ideas-close').addEventListener('click', () => {
  showIdeas(false);
  toggle.focus();
});
function countIdeas() {
  const f = readForm();
  const on = [f.title, f.greeting, f.cards, f.ascii].filter(Boolean).length;
  toggle.textContent = on ? `Ideas (${on})` : 'Ideas';
}

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

// What itch's theme editor sets (knowledge base §3, §4), into the mock only:
// · layout: exactly one of .mode_grid / .mode_column on .user_page;
// · background on #wrapper; text colour on .user_page, which game cards dim to 75 % and 50 %;
//   link colour on links (a literal colour, not only --itchio_link_color).
// All values come from colour inputs (#rrggbb) or a data: URL read here, so they're safe in CSS.
let bgImage = '';
function applyTheme() {
  const el = form.elements;
  const column = el.layout.value === 'column';
  const page = doc().querySelector('.user_page');
  page.classList.toggle('mode_grid', !column);
  page.classList.toggle('mode_column', column);

  const text = el.theme_text.value;
  const link = el.theme_link.value;
  const image = !bgImage
    ? ''
    : `background-image:url("${bgImage}");` +
      (el.theme_bg_mode.value === 'cover' ? 'background-size:cover;background-position:center;background-attachment:fixed' : 'background-repeat:repeat');
  doc().getElementById('user_theme').textContent = [
    `#wrapper{background-color:${el.theme_bg.value};${image}}`,
    `.user_page{color:${text};--itchio_link_color:${link}}`,
    `.user_page a,.footer a{color:${link}}`,
    `.game_title a{color:${text}}`,
    `.game_text{color:color-mix(in srgb,${text} 75%,transparent)}`,
    `.game_genre{color:color-mix(in srgb,${text} 50%,transparent)}`,
  ].join('');
}

const bgFile = form.elements.theme_bg_image;
const bgClear = document.getElementById('bg-clear');
function setBgImage(url) {
  bgImage = url;
  bgClear.hidden = form.elements.theme_bg_mode.hidden = !url;
  applyTheme();
}
bgFile.addEventListener('change', () => {
  const file = bgFile.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => setBgImage(reader.result);
  reader.readAsDataURL(file);
});
bgClear.addEventListener('click', () => {
  bgFile.value = '';
  setBgImage('');
});

function applyUser() {
  applyTheme();
  const { css, html } = readForm();
  doc().getElementById('custom_css').textContent = css;
  doc().getElementById('bio').innerHTML = html.trim() ? itchSanitize(html) : effectsBio + SAMPLE_BIO;
}

let timer;
let generation = 0;
function refreshEffects() {
  clearTimeout(timer);
  countIdeas();
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

// the editors' own hidden inputs also fire "input" (they only touch the user's CSS and HTML), and
// the theme controls only touch the mock (the image file is read on "change", above)
form.addEventListener('input', (e) => {
  if (e.target.closest('.CodeMirror')) return;
  if (e.target.name === 'layout' || e.target.name.startsWith('theme_')) {
    if (e.target.type !== 'file') applyTheme();
  } else refreshEffects();
});
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
