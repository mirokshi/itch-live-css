// The web's config (what the form edits and the store keeps) → engine config, CSS and bio HTML.
//
// form: {
//   accent    '#rrggbb'                                  → --gold (greeting colour, card labels)
//   title     null | { text, fonts: [key, ...] }         keys from public/fonts.js, 2–4 of them
//   greeting  null | { first, others: ['string', ...] }
//   cards     boolean
//   ascii     boolean
//   reserve   bytes of the profile cap kept free for the user's own CSS (0–5000, default 0)
// }

import { importLine, measure, paste, render } from '../../engine/src/index.js';
import { FONTS } from '../public/fonts.js';
import { BadRequest } from './http.js';

const fail = (msg) => {
  throw new BadRequest(msg);
};
const text = (s, max) => typeof s === 'string' && s.trim() !== '' && [...s].length <= max;

// Untrusted input → a clean form with only the known fields. Throws BadRequest.
export function check(f) {
  if (!f || typeof f !== 'object') fail('config must be an object');
  if (typeof f.accent !== 'string' || !/^#[0-9a-f]{6}$/i.test(f.accent)) fail('accent must be #rrggbb');
  const reserve = f.reserve ?? 0;
  if (!Number.isInteger(reserve) || reserve < 0 || reserve > 5000) fail('reserve: whole bytes from 0 to 5000');
  const out = { accent: f.accent.toLowerCase(), title: null, greeting: null, cards: f.cards === true, ascii: f.ascii === true, reserve };

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
function pluginList({ title, greeting, cards, ascii }) {
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

// What the chosen plugins need around them: { imports, rules } (imports must come before every rule).
function around(form, plugins) {
  const uses = plugins.map((p) => p.use);
  const imports = uses.includes('title')
    ? [`@import url("https://fonts.googleapis.com/css2?${form.title.fonts.map((k) => `family=${FONTS[k].google}`).join('&')}&display=swap");`]
    : [];
  // Variables the plugins read (the owner's pasted CSS defines them). On :root, so a user's own
  // pasted :root wins: imported rules lose specificity ties.
  const rules = [`:root{--gold:${form.accent};--ink:#eef3ff;--line:rgba(170,195,255,.18);--sans:system-ui,sans-serif}`];
  // the foil ring is positioned against the card
  if (uses.includes('cards')) rules.push('#wrapper .game_cell{position:relative}');
  return { imports, rules };
}

// Clean form → served CSS. opts go to render(): { seed, data: { games }, now }.
export function build(form, opts) {
  const plugins = pluginList(form);
  const { imports, rules } = around(form, plugins);
  return [...imports, ...rules].join('\n') + '\n' + render({ plugins }, opts);
}

// What the user pastes into the profile's CSS field: the @import of the served CSS, then a fixed
// copy of as many plugins as fit in the profile cap minus form.reserve (in form order), so the
// page keeps its look if the service fails. The copy sits in a cascade layer: unlayered rules beat layered ones whatever
// their order, so the served CSS (unlayered) always wins over it; without the layer the pasted
// copy would win the ties (imported rules lose them) and freeze the per-visit randomness.
// → { css, size: measure(), included: [plugin], left: [plugin] }
export function pasteForProfile(form, url) {
  // shortcut: plain http only for the local dev server, which importLine() refuses
  const line = url.startsWith('http://localhost') ? `@import url("${url}");` : importLine(url);
  const text = (plugins) => {
    const { imports, rules } = around(form, plugins);
    return [line, ...imports, `@layer custom-fallback{${rules.join('')}${paste({ plugins }, { seed: 'fallback' })}}`].join('\n');
  };
  const all = pluginList(form);
  const chosen = [];
  const fits = (css) => {
    const { bytes, limit } = measure(css, 'profile');
    return bytes + form.reserve <= limit.max;
  };
  for (const p of all) if (fits(text([...chosen, p]))) chosen.push(p);
  const css = text(chosen);
  return {
    css,
    size: measure(css, 'profile'),
    included: chosen.map((p) => p.use),
    left: all.filter((p) => !chosen.includes(p)).map((p) => p.use),
  };
}

const esc = (s) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

// The HTML the plugins hook into, to paste into the bio: one <span> per title letter, and the
// greeting marker (its own text is what screen readers read).
export function bioHtml({ title, greeting }) {
  const parts = [];
  if (title) parts.push(`<h1 class="custom-title">${[...title.text].map((c) => `<span>${esc(c)}</span>`).join('')}</h1>`);
  if (greeting) parts.push(`<p><span class="custom-hello">${esc(greeting.first)}</span></p>`);
  return parts.join('\n');
}
