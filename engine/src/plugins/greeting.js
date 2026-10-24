// Greeting roller: a marker written in the bio, <span class="custom-hello">Hi!</span>, becomes a
// vertical roller (like an airport board) that cycles through greetings. It always starts with
// `first`; the others come in a random order on each render. Each one holds for HOLD seconds, then
// rolls up to the next.
//
// options:
//   first   'string'     shown first and last (the loop closes on it unnoticed)
//   others  ['string']   the rest, shuffled
//   color   CSS colour   of the roller text (the marker's own text turns transparent)
//
// How, without touching the HTML:
// · The span becomes a two-column grid (auto | 0). Its own text falls in the 0-wide column and goes
//   transparent (also when selected), not visibility:hidden, so screen readers still read the
//   bio's real text; the roller's generated content has empty alt text (`content:"…" / ""`).
// · ::before holds ALL greetings, one per line (white-space:pre). The span is one line tall and
//   overflow-y:clip cuts the rest: that's the roller window. clip-path is not enough: the clipped
//   column still counts for page size and, rotated, caused horizontal scroll on phones.
// · The window is as wide as the longest greeting, right-aligned, so the bio sentence doesn't move.
// · With reduced motion, the pasted CSS should stop #wrapper *::before animations (block B1).
// `.custom-hello.custom-hello` (doubled class) beats the pasted .custom-hello rule: imported rules
// lose specificity ties (knowledge base §6).

import { cssString, n } from '../css.js';

const HOLD = 2.5; // s each greeting stays
const ROLL = 0.45; // s to roll to the next
const LINE = 1.4; // em: line height = window height = one roll step

export function greeting({ first, others, color }, { shuffle }) {
  if (typeof first !== 'string' || !Array.isArray(others) || !others.length || !color) {
    throw new Error('greeting: needs first (text), others (non-empty list) and color');
  }
  const words = [first, ...shuffle([...others]), first];
  const steps = words.length - 1;
  const period = steps * (HOLD + ROLL);
  const at = (s) => `${n((s / period) * 100)}%`;

  // for each greeting k: still on line k until its HOLD ends, then rolling to line k+1
  const frames = ['0%{translate:0 0}'];
  for (let k = 0; k < steps; k++) {
    const start = k * (HOLD + ROLL);
    frames.push(
      `${at(start + HOLD)}{translate:0 ${n(-k * LINE)}em}`,
      `${at(start + HOLD + ROLL)}{translate:0 ${n(-(k + 1) * LINE)}em}`,
    );
  }

  const list = cssString(words.join('\n'));
  return [
    `#wrapper .custom-hello.custom-hello{display:inline-grid;grid-template-columns:auto 0;` +
      `height:${LINE}em;line-height:${LINE};overflow-y:clip;` +
      'white-space:nowrap;color:transparent;' +
      // pops in with a small twist and bounce
      'animation:custom-hello-in .7s .5s cubic-bezier(.34,1.56,.64,1) both}',
    '#wrapper .custom-hello::selection{color:transparent;background:transparent}',
    `#wrapper .custom-hello::before{content:${list};content:${list} / "";` +
      `white-space:pre;text-align:right;color:${color};animation:custom-hello-roll ${n(period)}s ease-in-out infinite}`,
    '@keyframes custom-hello-in{from{opacity:0;scale:.5;rotate:-24deg}}',
    `@keyframes custom-hello-roll{${frames.join('')}}`,
  ];
}
