import { FONTS } from './fonts.js';

const form = document.getElementById('form');
const frame = document.getElementById('preview');
const stage = document.querySelector('.stage');
const status = document.getElementById('status');
const DEFAULT_FONTS = ['fraunces', 'inter', 'grotesk']; // pre-ticked for when the title idea is turned on

// Per page type: its mock, the words for "your text", and the sample text shown when the HTML
// editor is empty. A devlog post gets its game's theme and CSS (knowledge base §3.7).
const PAGES = {
  profile: {
    file: 'preview.html', title: 'Vista previa del perfil', html: 'Tu HTML de la bio', text: 'tu bio',
    where: 'del CSS de tu perfil', sample: '<p>Hago juegos pequeños. Este es un perfil de ejemplo.</p>',
    hint: 'En itch: Edit theme en tu perfil → CSS.',
  },
  project: {
    file: 'preview-project.html', title: 'Vista previa de la página del juego', html: 'Tu HTML de la descripción',
    text: 'la descripción del juego', where: 'del CSS de tu juego', sample: '<p>Un juego de ejemplo. Esta es su descripción.</p>',
    hint: 'En itch: Edit theme en la página del juego → CSS. Sus devlogs usan este mismo CSS.',
  },
  devlog: {
    file: 'preview-devlog.html', title: 'Vista previa del post del devlog', html: 'Tu HTML del post', text: 'el post',
    where: 'del CSS del juego', sample: '<p>Hoy sale la versión 1.0. Gracias por jugar.</p>',
    hint: 'Un devlog no tiene CSS propio: usa el del juego (Edit theme en la página del juego → CSS).',
  },
};

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
    page: d.get('page'),
    accent: d.get('accent'),
    title: d.has('title_on') ? { text: d.get('title_text'), fonts: d.getAll('title_font') } : null,
    greeting: d.has('greeting_on')
      ? { first: d.get('greeting_first'), others: d.get('greeting_others').split('\n').map((s) => s.trim()).filter(Boolean) }
      : null,
    cards: d.get('page') === 'profile' && d.has('cards'),
    ascii: d.has('ascii'),
    css: cssEditor.getValue(),
    html: htmlEditor.getValue(),
    showcase: d.has('showcase_on') ? { url: d.get('showcase_url').trim(), name: d.get('showcase_name') } : null,
  };
}

function fillForm(f) {
  const el = form.elements;
  el.page.value = f.page ?? 'profile';
  setPage(el.page.value);
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
  el.showcase_on.checked = !!f.showcase;
  el.showcase_url.value = f.showcase?.url ?? '';
  el.showcase_name.value = f.showcase?.name ?? '';
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

// What itch's theme editor writes, into the mock only (knowledge base §4.3–4.4). The branch follows
// the mock that is loaded (it can lag behind the page switch while the iframe reloads).
// · profile, style#user_theme: BG on body; Text, font, size and the 4 variables on .user_page; the
//   background image on .user_page_wrap (= #wrapper); Link on links and card titles; card text at
//   75 % / 50 % of Text; B. Radius on card covers; layout and banner are classes on .user_page;
// · game page and devlog, style#game_theme: BG and the background image on .wrapper (= #wrapper);
//   the BG2 panel, Text and font on .inner_column; headings font and colour; Link on links;
//   Buttons; the Screenshots option; size and banner alignment are classes.
// Every value comes from a colour/hex input checked below, a fixed <select>, a number range or a
// data: URL read here.
const FONT_CHOICES = ['Lato', 'Roboto', 'Open Sans', 'Montserrat', 'Nunito', 'Merriweather', 'Playfair Display', 'Press Start 2P', 'VT323', 'Space Mono'];
form.elements.theme_font.innerHTML = FONT_CHOICES.map((f) => `<option>${f}</option>`).join('');
form.elements.theme_hfont.innerHTML = '<option value="">Same as text</option>' + FONT_CHOICES.map((f) => `<option>${f}</option>`).join('');

const images = { bg: '', banner: '' };
const HEX = /^#[0-9a-f]{6}$/i;
const COLOURS = ['bg', 'bg2', 'text', 'link', 'buttons', 'headers'];
// each page type's default theme, set again when the page type changes
const THEME_DEFAULTS = {
  profile: { bg: '#ffffff', text: '#222222', link: '#ff2449' },
  game: { bg: '#eeeeee', bg2: '#ffffff', text: '#222222', link: '#fa5c5c', buttons: '#fa5c5c', headers: '#222222' },
};
const rgba = (hex, alpha) => `rgba(${[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(',')},${alpha})`;
const family = (f) => `family=${f.replaceAll(' ', '+')}:ital,wght@0,400;0,700;1,400`;

function applyTheme() {
  const el = form.elements;
  const d = doc();
  const game = !!d.getElementById('game_theme');
  const [bg, text, link] = ['bg', 'text', 'link'].map((k) => el[`theme_${k}`].value);
  const font = el.theme_font.value;
  const hfont = game ? el.theme_hfont.value : '';
  d.getElementById('theme_font').href =
    `https://fonts.googleapis.com/css2?${[...new Set(['Lato', font, hfont].filter(Boolean))].map(family).join('&')}&display=swap`;
  d.querySelector('.header img').src = images.banner || '';
  const image = images.bg
    ? `background-image:url("${images.bg}");background-repeat:${(game ? el.theme_prepeat : el.theme_repeat).value};` +
      `background-position:${el.theme_align.value};` +
      (el.theme_fixed.checked ? 'background-attachment:fixed' : '')
    : '';

  if (!game) {
    const page = d.querySelector('.user_page');
    const column = el.layout.value === 'column';
    page.classList.toggle('mode_grid', !column);
    page.classList.toggle('mode_column', column);
    page.classList.toggle('has_banner', !!images.banner);
    const radius = `${Number(el.theme_radius.value)}px`;
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
    return;
  }

  const header = d.getElementById('header');
  header.classList.toggle('has_image', !!images.banner);
  header.classList.remove('align_left', 'align_center', 'align_right');
  header.classList.add(`align_${el.theme_balign.value}`);
  const inner = d.getElementById('inner_column');
  inner.classList.remove('size_small', 'size_medium', 'size_large', 'size_very_large');
  inner.classList.add(`size_${el.theme_psize.value}`);
  const headings = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].map((h) => `.inner_column ${h}`).join(',');
  d.getElementById('game_theme').textContent = [
    `.wrapper{background-color:${bg};${image}}`,
    `.inner_column{color:${text};font-family:"${font}",Lato,sans-serif;` +
      `background-color:${rgba(el.theme_bg2.value, Number(el.theme_bg2_alpha.value) / 100)}}`,
    `${headings}{font-family:${hfont ? `"${hfont}"` : 'inherit'};color:${el.theme_headers.value}}`,
    `.inner_column a,.inner_column .footer a{color:${link}}`,
    `.inner_column .button{background-color:${el.theme_buttons.value};color:#fff}`,
    `.view_game_page .right_col{display:${el.theme_shots.value === 'hidden' ? 'none' : 'block'}}`,
  ].join('');
}

// each colour has a hex text box and a swatch, kept in step like itch's
for (const k of COLOURS) {
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
const bannerBox = document.getElementById('banner-box');
const showBanner = (on) => {
  document.getElementById('banner-clear').hidden = document.getElementById('banner-options').hidden = !on;
  bannerBox.style.backgroundImage = on ? `url("${images.banner}")` : '';
  bannerBox.classList.toggle('has-image', on);
};
readImage(form.elements.theme_bg_image, 'bg', showBg);
readImage(form.elements.theme_banner, 'banner', showBanner);
readImage(form.elements.theme_banner_p, 'banner', showBanner);
document.getElementById('bg-clear').addEventListener('click', () => {
  images.bg = '';
  form.elements.theme_bg_image.value = '';
  showBg(false);
  applyTheme();
});
for (const id of ['banner-clear', 'banner-clear-p']) {
  document.getElementById(id).addEventListener('click', () => {
    images.banner = '';
    form.elements.theme_banner.value = form.elements.theme_banner_p.value = '';
    showBanner(false);
    applyTheme();
  });
}

// "More options..." folds, as in itch's editor
for (const btn of document.querySelectorAll('.more-btn')) {
  btn.addEventListener('click', () => {
    const more = document.getElementById(btn.getAttribute('aria-controls'));
    more.hidden = !more.hidden;
    btn.setAttribute('aria-expanded', String(!more.hidden));
  });
}

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
  doc().getElementById('bio').innerHTML = html.trim() ? itchSanitize(html) : effectsBio + PAGES[form.dataset.page].sample;
}

// The page type: its mock (whose "load" refreshes everything), its theme defaults and the wording.
function setPage(page) {
  const p = PAGES[page];
  form.dataset.page = page;
  frame.title = p.title;
  document.getElementById('html-legend').textContent = p.html;
  document.getElementById('page-hint').textContent = p.hint;
  const strong = Object.assign(document.createElement('strong'), { textContent: 'al principio' });
  document.getElementById('link-hint').replaceChildren('Pon esta línea ', strong, ` ${p.where} en itch:`);
  document.getElementById('bio-hint').textContent = `Las ideas de título y saludo necesitan este HTML en ${p.text}:`;
  for (const [k, v] of Object.entries(THEME_DEFAULTS[page === 'profile' ? 'profile' : 'game'])) {
    form.elements[`theme_${k}`].value = v;
    form.elements[`theme_${k}_hex`].value = v;
  }
  if (new URL(frame.src).pathname !== `/${p.file}`) frame.src = p.file;
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

// The engine's validator on the user's CSS, under the editor: each problem with its rule from the
// knowledge base. Built with textContent: messages quote the user's selectors.
const lintBox = document.getElementById('lint');
let lintRun = 0;
async function lint() {
  const mine = ++lintRun;
  const css = cssEditor.getValue();
  if (!css.trim()) return lintBox.replaceChildren();
  try {
    const { problems } = await api('/api/validate', 'POST', { css, page: form.dataset.page });
    if (mine !== lintRun) return;
    const errors = problems.filter((p) => p.level === 'error').length;
    const summary = Object.assign(document.createElement('p'), {
      className: 'lint-summary',
      textContent: problems.length
        ? `${errors} ${errors === 1 ? 'error' : 'errores'}, ${problems.length - errors} ${problems.length - errors === 1 ? 'aviso' : 'avisos'}`
        : 'Sin problemas con las reglas de itch.',
    });
    const items = problems.map(({ rule, level, title, message }) => {
      const li = document.createElement('li');
      li.className = `lint-${level}`;
      const head = document.createElement('strong');
      head.textContent = `${level === 'error' ? 'Error' : 'Aviso'} · ${rule}${title ? ` · ${title}` : ''}`;
      li.append(head, document.createElement('br'), message);
      return li;
    });
    const list = document.createElement('ul');
    list.append(...items);
    lintBox.replaceChildren(summary, ...(items.length ? [list] : []));
  } catch (err) {
    if (mine === lintRun) lintBox.textContent = `No se pudo validar: ${err.message}`;
  }
}

let userTimer;
let lintTimer;
const refreshUser = () => {
  clearTimeout(userTimer);
  userTimer = setTimeout(applyUser, 200);
  clearTimeout(lintTimer);
  lintTimer = setTimeout(lint, 500);
};

const SHOWCASE_STATUS = {
  pending: 'Expositor: pendiente de aprobación.',
  approved: 'Expositor: aprobado, tu página ya sale.',
  rejected: 'Expositor: no aprobado.',
};

function showResult({ bio, link, showcase }) {
  const note = document.getElementById('showcase-status');
  note.hidden = !showcase;
  note.textContent = SHOWCASE_STATUS[showcase] ?? '';
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
  if (e.target.name === 'page') {
    setPage(e.target.value);
    lint();
  } else if (e.target.name.startsWith('showcase_')) {
    // only read on save
  } else if (e.target.name === 'layout' || e.target.name.startsWith('theme_')) {
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

setPage(form.elements.page.value);
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
// ?idea=<key>, from the ideas page: turn that effect on and open the ideas panel
const IDEA_FIELDS = { title: 'title_on', greeting: 'greeting_on', cards: 'cards', ascii: 'ascii' };
const idea = new URLSearchParams(location.search).get('idea');
if (Object.hasOwn(IDEA_FIELDS, idea)) {
  if (idea === 'cards' && form.dataset.page !== 'profile') {
    form.elements.page.value = 'profile'; // the cards effect only exists on profiles
    setPage('profile');
  }
  form.elements[IDEA_FIELDS[idea]].checked = true;
  showIdeas(true);
  countIdeas();
}
frame.addEventListener('load', refreshEffects);
if (doc()?.readyState === 'complete' && doc().getElementById('bio')) refreshEffects();
