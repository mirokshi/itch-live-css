// What the editor writes into the preview iframe (same-origin, no scripts): itch's sanitizer on the
// user's HTML, and what itch's theme editor would write (knowledge base §4.3–4.4, §5).

// Each page type's mock; its texts are under pages.<type> in locales/. A devlog post gets its game's
// theme and CSS (knowledge base §3.7).
export const PAGES = {
  profile: { file: '/preview.html' },
  project: { file: '/preview-project.html' },
  devlog: { file: '/preview-devlog.html' },
};

// What itch's sanitizer keeps of a bio (knowledge base §5): no scripts or styles, classes only if
// they start with "custom", no id, data-*, aria-* or role. The iframe has no allow-scripts anyway.
export function itchSanitize(html) {
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

export const FONT_CHOICES = ['Lato', 'Roboto', 'Open Sans', 'Montserrat', 'Nunito', 'Merriweather', 'Playfair Display', 'Press Start 2P', 'VT323', 'Space Mono'];

// each page type's default colours, set again when the page type changes
export const THEME_COLOURS = {
  profile: { bg: '#ffffff', text: '#222222', link: '#ff2449' },
  game: { bg: '#eeeeee', bg2: '#ffffff', text: '#222222', link: '#fa5c5c', buttons: '#fa5c5c', headers: '#222222' },
};
export const THEME_DEFAULTS = {
  bg2: '#ffffff', buttons: '#fa5c5c', headers: '#222222', ...THEME_COLOURS.profile,
  bg2_alpha: 100, font: 'Lato', size: 100, psize: 'large', hfont: '', shots: 'sidebar', balign: 'center',
  repeat: 'repeat', prepeat: 'repeat', align: '50% 0', fixed: false, layout: 'grid', radius: 0,
};

const rgba = (hex, alpha) => `rgba(${[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(',')},${alpha})`;
const family = (f) => `family=${f.replaceAll(' ', '+')}:ital,wght@0,400;0,700;1,400`;

// What itch's theme editor writes, into the mock only. The branch follows the mock that is loaded
// (it can lag behind the page switch while the iframe reloads).
// · profile, style#user_theme: BG on body; Text, font, size and the 4 variables on .user_page; the
//   background image on .user_page_wrap (= #wrapper); Link on links and card titles; card text at
//   75 % / 50 % of Text; B. Radius on card covers; layout and banner are classes on .user_page;
// · game page and devlog, style#game_theme: BG and the background image on .wrapper (= #wrapper);
//   the BG2 panel, Text and font on .inner_column; headings font and colour; Link on links;
//   Buttons; the Screenshots option; size and banner alignment are classes.
// t: theme values (colours checked as #rrggbb by the panel, the rest from fixed choices or numbers);
// images: data: URLs read in this browser.
export function applyTheme(d, t, images) {
  const game = !!d.getElementById('game_theme');
  const { bg, text, link, font } = t;
  const hfont = game ? t.hfont : '';
  d.getElementById('theme_font').href =
    `https://fonts.googleapis.com/css2?${[...new Set(['Lato', font, hfont].filter(Boolean))].map(family).join('&')}&display=swap`;
  d.querySelector('.header img').src = images.banner || '';
  const image = images.bg
    ? `background-image:url("${images.bg}");background-repeat:${game ? t.prepeat : t.repeat};` +
      `background-position:${t.align};` +
      (t.fixed ? 'background-attachment:fixed' : '')
    : '';

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
