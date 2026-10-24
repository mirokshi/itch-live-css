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

// What itch's profile theme editor writes into style#user_theme (knowledge base §4.3), into the
// mock only: BG on body; Text, font, size and the 4 variables on .user_page; the background image on
// .user_page_wrap (= #wrapper); Link on links and card titles; card text at 75 % / 50 % of Text;
// B. Radius on card covers. Layout and banner are classes on .user_page. Every value comes from a
// colour/hex input checked below, a fixed <select>, a number range or a data: URL read here.
const FONT_CHOICES = ['Lato', 'Roboto', 'Open Sans', 'Montserrat', 'Nunito', 'Merriweather', 'Playfair Display', 'Press Start 2P', 'VT323', 'Space Mono'];
form.elements.theme_font.innerHTML = FONT_CHOICES.map((f) => `<option>${f}</option>`).join('');

const images = { bg: '', banner: '' };
const HEX = /^#[0-9a-f]{6}$/i;

function applyTheme() {
  const el = form.elements;
  const d = doc();
  const page = d.querySelector('.user_page');
  const column = el.layout.value === 'column';
  page.classList.toggle('mode_grid', !column);
  page.classList.toggle('mode_column', column);
  page.classList.toggle('has_banner', !!images.banner);
  d.querySelector('.profile_banner').src = images.banner || '';

  const font = el.theme_font.value;
  d.getElementById('theme_font').href =
    `https://fonts.googleapis.com/css2?family=Lato:ital,wght@0,400;0,700;1,400&family=${font.replaceAll(' ', '+')}:ital,wght@0,400;0,700;1,400&display=swap`;

  const [bg, text, link] = ['bg', 'text', 'link'].map((k) => el[`theme_${k}`].value);
  const radius = `${Number(el.theme_radius.value)}px`;
  const image = images.bg
    ? `background-image:url("${images.bg}");background-repeat:${el.theme_repeat.value};background-position:${el.theme_align.value};` +
      (el.theme_fixed.checked ? 'background-attachment:fixed' : '')
    : '';
  d.getElementById('user_theme').textContent = [
    `body{background-color:${bg}}`,
    `.user_page{--itchio_font_family:"${font}";--itchio_link_color:${link};--itchio_border_radius:${radius};` +
      `color:${text};font-size:${Number(el.theme_size.value)}%;font-family:"${font}",Lato,sans-serif}`,
    `.user_page_wrap{${image}}`,
    `.user_page a,.footer a{color:${link}}`,
    `.game_grid_widget .game_cell .game_thumb{border-radius:${radius}}`,
    `.game_grid_widget .game_cell .game_title a.title{color:${link}}`,
    `.game_grid_widget .game_cell .game_text{color:color-mix(in srgb,${text} 75%,transparent)}`,
    `.game_grid_widget .game_cell .game_genre{color:color-mix(in srgb,${text} 50%,transparent)}`,
  ].join('');
}

// each colour has a hex text box and a swatch, kept in step like itch's
for (const k of ['bg', 'text', 'link']) {
  const hex = form.elements[`theme_${k}_hex`];
  const swatch = form.elements[`theme_${k}`];
  hex.addEventListener('input', () => HEX.test(hex.value) && (swatch.value = hex.value.toLowerCase()));
  hex.addEventListener('change', () => (hex.value = swatch.value)); // a half-typed value goes back
  swatch.addEventListener('input', () => (hex.value = swatch.value));
}

// image uploads: read in the browser as data: URLs, never sent anywhere
function readImage(input, key, onSet) {
  input.addEventListener('change', () => {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      images[key] = reader.result;
      onSet(true);
      applyTheme();
    };
    reader.readAsDataURL(file);
  });
}
const bgBox = document.getElementById('bg-box');
const showBg = (on) => {
  document.getElementById('bg-options').hidden = !on;
  bgBox.style.backgroundImage = on ? `url("${images.bg}")` : '';
  bgBox.classList.toggle('has-image', on);
};
const showBanner = (on) => (document.getElementById('banner-clear').hidden = !on);
readImage(form.elements.theme_bg_image, 'bg', showBg);
readImage(form.elements.theme_banner, 'banner', showBanner);
document.getElementById('bg-clear').addEventListener('click', () => {
  images.bg = '';
  form.elements.theme_bg_image.value = '';
  showBg(false);
  applyTheme();
});
document.getElementById('banner-clear').addEventListener('click', () => {
  images.banner = '';
  form.elements.theme_banner.value = '';
  showBanner(false);
  applyTheme();
});

// the panel folds away to give the preview the whole width
const themePanel = document.getElementById('theme');
const themeOpen = document.getElementById('theme-open');
document.getElementById('theme-close').addEventListener('click', () => {
  themePanel.hidden = true;
  themeOpen.hidden = false;
  themeOpen.focus();
});
themeOpen.addEventListener('click', () => {
  themePanel.hidden = false;
  themeOpen.hidden = true;
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
