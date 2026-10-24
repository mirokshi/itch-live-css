// ASCII field behind the whole profile, inspired by the new-session screen of the Claude app. No
// JavaScript (itch forbids it), so it doesn't follow the mouse: it's a "live" field on its own.
//
// · Field (#wrapper::before): random letters and digits, new on each render, in faint blue at two
//   intensities; most visible behind the title and dimmer towards the edges (radial mask). It's an
//   SVG built here (data URI), tiled.
// · Waves (#wrapper::after): the same tile (same positions), brighter and with some characters
//   swapped, seen through a wave-shaped mask, as if it rewrote the field as it passes. Each render
//   brings a sequence of WAVES different waves:
//     - shape: an irregular blob per wave (a closed wavy outline, blurred, with a fainter trail
//       inwards) → mask SVG;
//     - it's born small at a random point and slowly grows to a random size (GROW, never the whole
//       screen) while it fades in and out.
//   The blobs go once, as mask layers; the animation only changes each layer's size and position:
//   the current wave's layer grows (size and position together, so its centre stays put) and the
//   others stay at size 0, which paints nothing. The whole layer's opacity fades each wave in and
//   out. After each wave, steps(1) holds the values through the calm (already invisible) and jumps
//   to the next wave's. After the last wave the sequence repeats.
// · Both layers are fixed to the viewport with z-index:-1: above itch's background image (neither
//   covering nor blurring it) and below the content. Font: the system monospace (an SVG used as an
//   image can't load web fonts); textLength forces the exact grid whatever the font.
// · Reduced motion: the field stays still and the waves don't show.
//
// The randomness is drawn in the prototype's order (grid, bright, swapped, waves, blobs), so the
// parity check can compare it with lib/ascii.js.

import { n } from '../css.js';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const COLS = 100;
const ROWS = 32;
const CW = 8; // px per character
const LH = 14; // px per line → 800×448 tile
const W = COLS * CW;
const H = ROWS * LH;
const BRIGHT = 0.3; // share of field characters at the high intensity
const SWAP = 0.15; // share of characters the wave "rewrites"
const CENTER = '50% 22%'; // most visible area of the field: behind the title
const WAVES = 5; // different waves per sequence
const GROW = [40, 80]; // vmax: final size of each blob (random)
const LIFE = [10, 14]; // s each wave lasts, from birth to fade-out
const CALM = [3, 7]; // s of calm between waves

const svgUrl = (s) => `url("data:image/svg+xml,${s.replace(/[<>#%"]/g, encodeURIComponent)}")`;

// text rows: each character goes through keep(); the rest become spaces
function svg(grid, layers) {
  const rows = (keep) =>
    grid
      .map((row, i) => {
        const text = row.map((c, j) => (keep(i, j) ? c : ' ')).join('');
        return `<text y='${(i + 1) * LH - 3}' textLength='${W}' lengthAdjust='spacing'>${text}</text>`;
      })
      .join('');
  const groups = layers.map(([fill, keep]) => `<g fill='${fill}'>${rows(keep)}</g>`).join('');
  // white-space:pre on each <text>: otherwise runs of spaces (each layer's gaps) collapse, rows end
  // up with different lengths, textLength spaces them differently and the layers misalign. It must
  // be a `text` rule: Chrome gives text white-space:nowrap by default and ignores xml:space.
  return svgUrl(
    `<svg xmlns='http://www.w3.org/2000/svg' width='${W}' height='${H}'>` +
      `<style>text{white-space:pre}</style>` +
      `<g font-family='Consolas,Menlo,monospace' font-size='11'>${groups}</g></svg>`,
  );
}

// Amorphous blob for the mask (100×100 SVG): a closed outline through 8-11 points around the
// centre at random distances, smoothed with curves (Catmull-Rom → Bézier). Drawn as a blurred
// stroke (the wave front) plus a wide faint stroke (its trail).
function blob(rand) {
  const count = 8 + Math.floor(rand(0, 4));
  const pts = Array.from({ length: count }, (_, i) => {
    const a = ((i + rand(-0.3, 0.3)) / count) * 2 * Math.PI;
    const r = 30 * rand(0.6, 1.2);
    return [50 + r * Math.cos(a), 50 + r * Math.sin(a)];
  });
  const p = (i) => pts[(i + count) % count];
  const xy = ([x, y]) => `${+x.toFixed(1)} ${+y.toFixed(1)}`;
  let d = `M${xy(p(0))}`;
  for (let i = 0; i < count; i++) {
    const [p0, p1, p2, p3] = [p(i - 1), p(i), p(i + 1), p(i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${xy(c1)} ${xy(c2)} ${xy(p2)}`;
  }
  d += 'Z';
  return svgUrl(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>` +
      `<filter id='b' x='-20%' y='-20%' width='140%' height='140%'><feGaussianBlur stdDeviation='1.4'/></filter>` +
      `<defs><path id='p' d='${d}'/></defs>` + // in defs, or it would also paint a black fill
      `<g fill='none' stroke='#000' filter='url(#b)'>` +
      `<use href='#p' stroke-width='10' stroke-opacity='.25'/><use href='#p' stroke-width='3.5'/></g></svg>`,
  );
}

// Wave sequence → @keyframes custom-ascii-wave. Per wave: born (small, invisible) → fades in (25%
// of its life) → grows and fades out to its final size. mask-position = centre − size/2, so with
// size and position on the same curve the centre stays put. Every frame carries the full lists
// (one entry per layer: "0 0" for the idle ones).
function waveKeyframes(rand) {
  const frames = []; // [second, properties, timing function to the next frame]
  const HOLD = 'steps(1,end)';
  const GO = 'cubic-bezier(.25,.1,.4,1)';
  const layers = (k, cx, cy, size) => {
    const pick = (on) => Array.from({ length: WAVES }, (_, i) => (i === k ? on : '0 0')).join(',');
    return (
      `mask-size:${pick(`${size}vmax ${size}vmax`)};` +
      `mask-position:${pick(`calc(${cx}vw - ${size / 2}vmax) calc(${cy}vh - ${size / 2}vmax)`)}`
    );
  };
  const idle = `${layers(-1)};opacity:0`;
  let t = rand(1, 3); // the first one shortly after load
  frames.push([0, idle, HOLD]);
  for (let k = 0; k < WAVES; k++) {
    const life = rand(...LIFE);
    const cx = Math.round(rand(10, 90));
    const cy = Math.round(rand(10, 90));
    const end = Math.round(rand(...GROW));
    frames.push([t, `${layers(k, cx, cy, 4)};opacity:0`, GO]);
    frames.push([t + life * 0.25, 'opacity:1', 'linear']);
    frames.push([t + life, `${layers(k, cx, cy, end)};opacity:0`, HOLD]);
    t += life + rand(...CALM);
  }
  frames.push([t, idle, HOLD]);
  const css = frames
    .map(([s, props, tf]) => `${n((s / t) * 100)}%{${props};animation-timing-function:${tf}}`)
    .join('');
  return { css: `@keyframes custom-ascii-wave{${css}}`, total: t };
}

export function ascii(options, { next, rand }) {
  const char = () => CHARS[Math.floor(next() * CHARS.length)];
  const grid = Array.from({ length: ROWS }, () => Array.from({ length: COLS }, char));
  const bright = grid.map((row) => row.map(() => next() < BRIGHT));
  const swapped = grid.map((row) => row.map((c) => (next() < SWAP ? char() : c)));

  const field = svg(grid, [
    ['rgba(150,180,255,.2)', (i, j) => !bright[i][j]],
    ['rgba(170,200,255,.42)', (i, j) => bright[i][j]],
  ]);
  const wave = svg(swapped, [['rgba(215,230,255,.85)', () => true]]);

  const layer = 'content:"";position:fixed;inset:0;z-index:-1;pointer-events:none;background-position:0 0';
  const { css: keyframes, total } = waveKeyframes(rand);
  return [
    keyframes,
    `#wrapper::before{${layer};background-image:${field};` +
      `mask-image:radial-gradient(ellipse 75% 65% at ${CENTER},#000,rgba(0,0,0,.45) 70%,rgba(0,0,0,.25))}`,
    `#wrapper::after{${layer};background-image:${wave};` +
      `mask-image:${Array.from({ length: WAVES }, () => blob(rand)).join(',')};mask-repeat:no-repeat;mask-size:0 0;opacity:0;` +
      `animation:custom-ascii-wave ${n(total)}s infinite}`,
    '@media (prefers-reduced-motion:reduce){#wrapper::after{display:none}}',
  ];
}
