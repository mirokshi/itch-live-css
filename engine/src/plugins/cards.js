// Game cards: a golden "foil" border, plus figures and labels from itch's data.
//
// · Foil: at rest, a faint golden glint slowly runs round each card's outline (one lap every
//   FOIL_SLOW s, with a random offset per card on each render, so they don't move together); on
//   hover, a brighter, faster one on top (FOIL_FAST s). The gradient border sits in .game_cell's
//   ::before (slow) and ::after (fast): a plain border can't take gradients with rounded corners,
//   so the whole box is painted and a mask cuts out the inside (a 1–1.5px ring). It turns by
//   animating the conic-gradient's start angle --foil. With reduced motion both stop (the pasted
//   CSS for ::before, block B1; here for ::after).
// · Figures (data.games): "👁 1.2k   ⬇ 340" under the card's details, in a pill. Downloads only
//   when there are some (browser games barely have any).
// · Labels on the cover, top right (itch's "GIF" goes left): "Most viewed" for the game with the
//   most views and "New" for games published less than NEW_DAYS ago.
//   Each card is found by its data-game_id attribute (= the API id): not a documented selector.
// · Screen readers: the alt text (`content:"…" / "…"`) says words instead of symbols
//   ("1.2k views, 340 downloads").
// In English, like itch's interface. Colours come from the owner's pasted CSS (--line, --ink,
// --gold, --sans).
//
// data.games: [{ id, views, downloads, published }] (published: ms since epoch), from itch's API
// (https://api.itch.io/profile/games); the service fetches it, not the engine. Without games, only
// the foil. now (ms) decides what counts as "New", so tests can pin it.

import { cssString, n } from '../css.js';

const FOIL_CARDS = 12; // cards per grid with their own slow-glint offset
const FOIL_SLOW = 12; // s per lap at rest
const FOIL_FAST = 2.4; // s per lap on hover
const NEW_DAYS = 90;
const DAY = 24 * 60 * 60 * 1000;
const EYE = String.fromCodePoint(0x1f441, 0xfe0e); // FE0E: text version, so it takes the pill's colour
const DOWN = String.fromCodePoint(0x2b07, 0xfe0e);

// 950 → "950", 1234 → "1.2k", 12345 → "12k", 1234567 → "1.2M"
function short(x) {
  if (x < 1000) return String(x);
  const [unit, suffix] = x < 1e6 ? [1e3, 'k'] : [1e6, 'M'];
  const v = x / unit;
  return (v < 10 ? +v.toFixed(1) : Math.round(v)) + suffix;
}

// content with alt text (browsers that don't know it keep the first one)
const content = (shown, spoken) =>
  `content:${cssString(shown)};content:${cssString(shown)} / ${cssString(spoken)}`;

// golden glint with a white centre on a conic-gradient starting at --foil:
// [gold, white, gold, end] in degrees, at opacity a
const foilRing = (a, [gold1, white, gold2, end]) =>
  `conic-gradient(from var(--foil),transparent 0deg,rgba(255,200,87,${a}) ${gold1}deg,` +
  `rgba(255,255,255,${a}) ${white}deg,rgba(255,200,87,${a}) ${gold2}deg,transparent ${end}deg)`;

function foilCss(rand) {
  const delays = [];
  for (let k = 1; k <= FOIL_CARDS; k++) {
    delays.push(`#wrapper .game_cell:nth-child(${k})::before{animation-delay:${n(-rand(0, FOIL_SLOW))}s}`);
  }
  return [
    '@property --foil{syntax:"<angle>";inherits:false;initial-value:0deg}',
    '@keyframes custom-foil{to{--foil:360deg}}',
    '#wrapper .game_cell::before,#wrapper .game_cell::after{content:"";position:absolute;inset:-1px;' +
      'border-radius:inherit;pointer-events:none;padding:1.5px;opacity:0;transition:opacity .35s;' +
      '-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);' +
      '-webkit-mask-composite:xor;mask-composite:exclude}',
    `#wrapper .game_cell::before{opacity:.5;padding:1px;background:${foilRing(0.8, [40, 60, 80, 120])};` +
      `animation:custom-foil ${FOIL_SLOW}s linear infinite}`,
    ...delays,
    `#wrapper .game_cell::after{background:${foilRing(0.95, [50, 80, 110, 160])}}`,
    '#wrapper .game_cell:hover::before{opacity:0}',
    `#wrapper .game_cell:hover::after{opacity:1;animation:custom-foil ${FOIL_FAST}s linear infinite}`,
    '@media (prefers-reduced-motion:reduce){#wrapper .game_cell::after{animation:none}}',
  ];
}

function statsCss(games, now) {
  if (!games.length) return [];
  for (const g of games) {
    // the id goes into a selector: only plain integers get there
    if (!Number.isSafeInteger(g.id) || !(g.views >= 0) || !(g.downloads >= 0)) {
      throw new Error(`cards: game ${JSON.stringify(g.id)} needs an integer id and non-negative views and downloads`);
    }
  }
  const top = games.length > 1 ? games.reduce((a, b) => (b.views > a.views ? b : a)) : null;
  const rules = [
    // .game_cell_data is a flex column (itch): align-self so the pill doesn't stretch
    '#wrapper .game_cell .game_cell_data::after{align-self:flex-start;margin-top:.6em;' +
      'padding:.2em .7em;border-radius:999px;background:var(--line);' +
      'font:600 .85rem/1.4 var(--sans);color:var(--ink);white-space:pre}',
    '#wrapper .game_cell .game_thumb::after{position:absolute;top:8px;right:8px;' +
      'padding:.15em .6em;border-radius:999px;background:var(--gold);color:#0b1433;' +
      'font:700 .72rem/1.5 var(--sans);box-shadow:0 2px 8px rgba(0,0,0,.35);pointer-events:none}',
  ];
  for (const g of games) {
    const card = `#wrapper .game_cell[data-game_id="${g.id}"]`;

    const shown = [`${EYE} ${short(g.views)}`];
    const spoken = [`${short(g.views)} views`];
    if (g.downloads > 0) {
      shown.push(`${DOWN} ${short(g.downloads)}`);
      spoken.push(`${short(g.downloads)} downloads`);
    }
    rules.push(`${card} .game_cell_data::after{${content(shown.join('   '), spoken.join(', '))}}`);

    const labels = [];
    if (g === top && g.views > 0) labels.push('Most viewed');
    if (now - g.published < NEW_DAYS * DAY) labels.push('New');
    if (labels.length) rules.push(`${card} .game_thumb::after{${content(labels.join(' · '), labels.join(', '))}}`);
  }
  return rules;
}

export function cards(options, { rand }, { data, now }) {
  return [...foilCss(rand), ...statsCss(data.games ?? [], now)];
}
