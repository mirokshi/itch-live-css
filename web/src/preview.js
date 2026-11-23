// What the editor writes into the preview iframe (same-origin, no scripts): itch's sanitizer on the
// user's HTML, and what itch's theme editor would write (knowledge base §4.3–4.4, §5).

import { KEPT_CLASSES, STRIPPED_ATTRS } from '../../engine/src/rules.js';

// Each page type's mock; its texts are under pages.<type> in locales/. A devlog post gets its game's
// theme and CSS (knowledge base §3.7); a jam overview has a theme of its own (§4.5).
export const PAGES = {
  profile: { file: '/preview.html' },
  project: { file: '/preview-project.html' },
  devlog: { file: '/preview-devlog.html' },
  jam: { file: '/preview-jam.html' },
};

// What itch's sanitizer keeps of a bio (knowledge base §5): no scripts or styles, classes only if
// they start with "custom" or are one of its own, none of the stripped attributes (the engine's lists,
// which the validator's R11 check uses too). The iframe has no allow-scripts anyway.
export function itchSanitize(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll('script, style, link, meta, object, embed, form, input, button, select, textarea').forEach((e) => e.remove());
  for (const el of doc.body.querySelectorAll('*')) {
    for (const { name } of [...el.attributes]) {
      if (name === 'class') {
        const keep = [...el.classList].filter((c) => c.startsWith('custom') || KEPT_CLASSES.includes(c) || (el.localName === 'code' && c.startsWith('language-')));
        if (keep.length) el.setAttribute('class', keep.join(' '));
        else el.removeAttribute('class');
      } else if (STRIPPED_ATTRS.test(name) && !(name === 'tabindex' && el.classList.contains('spoiler'))) el.removeAttribute(name);
    }
  }
  return doc.body.innerHTML;
}

export const FONT_CHOICES = ['Lato', 'Roboto', 'Open Sans', 'Montserrat', 'Nunito', 'Merriweather', 'Playfair Display', 'Press Start 2P', 'VT323', 'Space Mono'];

// each page type's default colours, set again when the page type changes
export const THEME_COLOURS = {
  profile: { bg: '#ffffff', text: '#222222', link: '#ff2449' },
  game: { bg: '#eeeeee', bg2: '#ffffff', text: '#222222', link: '#fa5c5c', buttons: '#fa5c5c', headers: '#222222' },
  jam: { bg: '#eeeeee', bg2: '#ffffff', text: '#222222', link: '#fa5c5c', buttons: '#fa5c5c', headers: '#222222' },
};
export const THEME_DEFAULTS = {
  bg2: '#ffffff', buttons: '#fa5c5c', headers: '#222222', ...THEME_COLOURS.profile,
  bg2_alpha: 100, font: 'Lato', size: 100, psize: 'large', hfont: '', shots: 'sidebar', balign: 'center',
  repeat: 'repeat', prepeat: 'repeat', align: '50% 0', fixed: false, layout: 'grid', radius: 0,
  shadow: 'none', bsize: '', // jam only: the panel's shadow preset, background-size
};

const rgba = (hex, alpha) => `rgba(${[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(',')},${alpha})`;
const family = (f) => `family=${f.replaceAll(' ', '+')}:ital,wght@0,400;0,700;1,400`;
// a colour moved by `by` on each channel, as itch derives a jam's button shades (§4.5.4)
const shade = (hex, by) => `#${[1, 3, 5].map((i) => Math.min(255, Math.max(0, parseInt(hex.slice(i, i + 2), 16) + by)).toString(16).padStart(2, '0')).join('')}`;
const light = (hex) => [1, 3, 5].reduce((sum, i, n) => sum + parseInt(hex.slice(i, i + 2), 16) * [0.299, 0.587, 0.114][n], 0) > 160;
// the jam panel's presets (§4.5.4); the glow takes the link colour
const SHADOWS = {
  none: () => '0 0 0 2px transparent',
  outline: () => '0 0 0 2px #dadada',
  shadow: () => '0 0 0 2px transparent,0 4px 12px rgba(0,0,0,.28)',
  glow: (link) => `0 0 0 2px transparent,0 0 24px ${rgba(link, 0.45)}`,
};

// What itch's theme editor writes, into the mock only. The branch follows the mock that is loaded
// (it can lag behind the page switch while the iframe reloads).
// · profile, style#user_theme: BG on body; Text, font, size and the 4 variables on .user_page; the
//   background image on .user_page_wrap (= #wrapper); Link on links and card titles; card text at
//   75 % / 50 % of Text; B. Radius on card covers; layout and banner are classes on .user_page;
// · game page and devlog, style#game_theme: BG and the background image on .wrapper (= #wrapper);
//   the BG2 panel, Text and font on .inner_column; headings font and colour; Link on links;
//   Buttons; the Screenshots option; size and banner alignment are classes;
// · jam, style#jam_theme: the generated rules in itch's order (§4.5.1): BG on body; Text, BG, font,
//   size % and the 9 variables (button shades derived) plus the background image on .jam_page_wrap
//   (= #wrapper); the radius on .jam_body; headings; the BG2 panel and its alpha; the shadow preset;
//   the grid's text colours, which itch writes with !important.
// t: theme values (colours checked as #rrggbb by the panel, the rest from fixed choices or numbers);
// images: data: URLs read in this browser.
export function applyTheme(d, t, images) {
  const jam = !!d.getElementById('jam_theme');
  const game = jam || !!d.getElementById('game_theme');
  const { bg, text, link, font } = t;
  const hfont = game ? t.hfont : '';
  d.getElementById('theme_font').href =
    `https://fonts.googleapis.com/css2?${[...new Set(['Lato', font, hfont].filter(Boolean))].map(family).join('&')}&display=swap`;
  d.querySelector('.header img, .jam_banner').src = images.banner || '';
  const image = images.bg
    ? `background-image:url("${images.bg}");background-repeat:${game ? t.prepeat : t.repeat};` +
      `background-position:${t.align};` +
      (jam && t.bsize ? `background-size:${t.bsize};` : '') +
      (t.fixed ? 'background-attachment:fixed' : '')
    : '';

  if (jam) {
    d.querySelector('.view_jam_page').classList.toggle('has_banner', !!images.banner);
    const b = t.buttons;
    const edge = shade(b, -25);
    const headings = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].map((h) => `.view_jam_page ${h}`).join(',');
    const grid = '.view_jam_page .game_grid_widget .game_cell';
    d.getElementById('jam_theme').textContent = [
      `body{background-color:${bg}}`,
      `.jam_page_wrap{color:${text};background-color:${bg};font-family:"${font}",Lato,LatoExtended,sans-serif;font-size:${Number(t.size)}%;` +
        `--itchio_link_color:${link};--itchio_border_radius:${Number(t.radius) ? `${Number(t.radius)}px` : 'initial'};` +
        `--itchio_button_color:${b};--itchio_button_fg_color:${light(b) ? '#222222' : '#ffffff'};` +
        `--itchio_button_hover_color:${shade(b, -10)};--itchio_button_active_color:${shade(b, -5)};` +
        `--itchio_button_shadow_color:${edge};--itchio_button_border_color:${edge};${image}}`,
      '.jam_body{border-radius:var(--itchio_border_radius,0)}',
      `${headings}{${hfont ? `font-family:"${hfont}";` : ''}color:${t.headers}}`,
      `.view_jam_page .jam_body,.view_jam_page .grid_outer{background-color:${rgba(t.bg2, Number(t.bg2_alpha) / 100)}}`,
      `.view_jam_page .jam_body{box-shadow:${(SHADOWS[t.shadow] ?? SHADOWS.none)(link)}}`,
      `.jam_filter_picker .filter_item.active{border-color:${link}!important}`,
      `${grid} .game_author a,.view_jam_page .game_count{color:${shade(text, 90)}!important}`,
    ].join('');
    return;
  }

  if (!game) {
    const page = d.querySelector('.user_page');
    const column = t.layout === 'column';
    page.classList.toggle('mode_grid', !column);
    page.classList.toggle('mode_column', column);
    page.classList.toggle('has_banner', !!images.banner);
    const radius = `${Number(t.radius)}px`;
    d.getElementById('user_theme').textContent = [
      `body{background-color:${bg}}`,
      `.user_page{--itchio_font_family:"${font}";--itchio_link_color:${link};--itchio_border_radius:${radius};` +
        `color:${text};font-size:${Number(t.size)}%;font-family:"${font}",Lato,sans-serif}`,
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
  header.classList.add(`align_${t.balign}`);
  const inner = d.getElementById('inner_column');
  inner.classList.remove('size_small', 'size_medium', 'size_large', 'size_very_large');
  inner.classList.add(`size_${t.psize}`);
  const headings = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].map((h) => `.inner_column ${h}`).join(',');
  d.getElementById('game_theme').textContent = [
    `.wrapper{background-color:${bg};${image}}`,
    `.inner_column{color:${text};font-family:"${font}",Lato,sans-serif;` +
      `background-color:${rgba(t.bg2, Number(t.bg2_alpha) / 100)}}`,
    `${headings}{font-family:${hfont ? `"${hfont}"` : 'inherit'};color:${t.headers}}`,
    `.inner_column a,.inner_column .footer a{color:${link}}`,
    `.inner_column .button{background-color:${t.buttons};color:#fff}`,
    `.view_game_page .right_col{display:${t.shots === 'hidden' ? 'none' : 'block'}}`,
  ].join('');
}
