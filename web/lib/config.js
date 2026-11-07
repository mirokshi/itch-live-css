// The web's config (what the form edits and the store keeps) → served CSS, bio HTML and @import line.
//
// form: {
//   page      'profile' | 'project' | 'devlog'  where the CSS goes (a devlog uses its project's CSS)
//   accent    '#rrggbb'                                  → --gold (greeting colour, card labels)
//   title     null | { text, fonts: [key, ...] }         keys from lib/fonts.js, 2–4 of them
//   greeting  null | { first, others: ['string', ...] }
//   cards     boolean, profile only (the effect styles the profile's game cards)
//   ascii     boolean
//   css       the user's own CSS, served after the effects (it wins their ties)
//   html      the user's bio / description / post HTML, only for the preview: never served
//   showcase  null | { url, name }  asks to appear in the showcase (an admin approves it): the itch
//             page's address and an optional display name
// }

import { importLine, render } from '../../engine/src/index.js';
import { FONTS } from './fonts.js';
import { BadRequest } from './http.js';

export const PAGES = ['profile', 'project', 'devlog'];
const MAX_CSS = 50000; // characters
const MAX_HTML = 5000; // characters, itch's bio cap

const fail = (msg) => {
  throw new BadRequest(msg);
};
const text = (s, max) => typeof s === 'string' && s.trim() !== '' && [...s].length <= max;
const optional = (s, max, name) => {
  if (s === undefined) return '';
  if (typeof s !== 'string' || s.length > max) fail(`${name}: text of at most ${max} characters`);
  return s;
};

// Untrusted input → a clean form with only the known fields. Throws BadRequest.
export function check(f) {
  if (!f || typeof f !== 'object') fail('config must be an object');
  if (typeof f.accent !== 'string' || !/^#[0-9a-f]{6}$/i.test(f.accent)) fail('accent must be #rrggbb');
  const page = f.page ?? 'profile';
  if (!PAGES.includes(page)) fail(`page must be one of ${PAGES.join(', ')}`);
  const out = {
    page,
    accent: f.accent.toLowerCase(),
    title: null,
    greeting: null,
    cards: f.cards === true && page === 'profile',
    ascii: f.ascii === true,
    css: optional(f.css, MAX_CSS, 'css'),
    html: optional(f.html, MAX_HTML, 'html'),
    showcase: null,
  };
  if (f.showcase) {
    const { url, name = '' } = f.showcase;
    // an itch.io page on https, nothing else: it is shown as a link to everyone
    if (typeof url !== 'string' || url.length > 200 || !/^https:\/\/[a-z0-9-]+\.itch\.io(\/[\w./-]*)?$/.test(url)) {
      fail('showcase: the address of your itch.io page, like https://you.itch.io/ or https://you.itch.io/game');
    }
    if (typeof name !== 'string' || [...name].length > 40) fail('showcase: a name of at most 40 characters');
    out.showcase = { url, name: name.trim() };
  }

  if (f.title) {
    const { text: t, fonts } = f.title;
    if (!text(t, 24)) fail('title: text of 1–24 characters');
    if (
      !Array.isArray(fonts) || fonts.length < 2 || fonts.length > 4 ||
      new Set(fonts).size !== fonts.length || !fonts.every((k) => Object.hasOwn(FONTS, k))
    ) fail('title: pick 2–4 different fonts from the list');
    out.title = { text: t, fonts: [...fonts] };
  }

  if (f.greeting) {
    const { first, others } = f.greeting;
    if (!text(first, 40)) fail('greeting: first greeting of 1–40 characters');
    if (!Array.isArray(others) || others.length < 1 || others.length > 20 || !others.every((s) => text(s, 40))) {
      fail('greeting: 1–20 other greetings of 1–40 characters each');
    }
    out.greeting = { first, others: [...others] };
  }
  return out;
}

// Clean form → the engine's plugin list.
export function pluginList({ title, greeting, cards, ascii }) {
  const plugins = [];
  if (title) {
    // fonts cycle along the letters, so no font fills more than half the bag (the engine's rule)
    const bag = [...title.text].map((_, i) => title.fonts[i % title.fonts.length]);
    plugins.push({ use: 'title', options: { fonts: Object.fromEntries(title.fonts.map((k) => [k, FONTS[k].css])), bag } });
  }
  if (greeting) plugins.push({ use: 'greeting', options: { ...greeting, color: 'var(--gold)' } });
  if (cards) plugins.push({ use: 'cards' });
  if (ascii) plugins.push({ use: 'ascii' });
  return plugins;
}

// The @charset/@import statements at the start of the user's CSS: they only work at the top of a
// stylesheet, so they move above the effects. Quoted parts may hold ";".
export const LEADING = /^(?:\s+|\/\*[\s\S]*?\*\/|@(?:charset|import)\b(?:"[^"]*"|'[^']*'|[^;"'])*;)*/;

// Clean form → served CSS. opts go to render(): { seed, data: { games }, now }.
export function build(form, opts) {
  const plugins = pluginList(form);
  const lead = form.css.match(LEADING)[0];
  const head = [];
  if (form.title) {
    head.push(`@import url("https://fonts.googleapis.com/css2?${form.title.fonts.map((k) => `family=${FONTS[k].google}`).join('&')}&display=swap");`);
  }
  if (lead.trim()) head.push(lead.trim());
  // Variables the plugins read, set for itch's default light theme. On #wrapper, not :root (R3), so
  // the user's own CSS (later in this sheet) or pasted CSS can change them with #wrapper{…}.
  head.push(`#wrapper{--gold:${form.accent};--ink:#222;--line:rgba(0,0,0,.08);--sans:system-ui,sans-serif}`);
  // the foil ring is positioned against the card
  if (form.cards) head.push('#wrapper .game_cell{position:relative}');
  const rest = form.css.slice(lead.length).trim();
  return head.join('\n') + '\n' + render({ plugins }, opts) + (rest ? `${rest}\n` : '');
}

// The line to paste into itch's CSS field.
// shortcut: plain http only for the local dev server, which importLine() refuses
export const linkLine = (url) => (url.startsWith('http://localhost') ? `@import url("${url}");` : importLine(url));

const esc = (s) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

// The HTML the plugins hook into, to paste into the bio: one <span> per title letter, and the
// greeting marker (its own text is what screen readers read).
export function bioHtml({ title, greeting }) {
  const parts = [];
  if (title) parts.push(`<h1 class="custom-title">${[...title.text].map((c) => `<span>${esc(c)}</span>`).join('')}</h1>`);
  if (greeting) parts.push(`<p><span class="custom-hello">${esc(greeting.first)}</span></p>`);
  return parts.join('\n');
}
