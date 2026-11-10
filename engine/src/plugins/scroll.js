// Three scroll-driven effects (animation-timeline), all static CSS: they are pasted, no link needed.
// Each sits inside @media (prefers-reduced-motion:no-preference){@supports (animation-timeline:…){…}},
// and the element's base style is its finished, visible state, so browsers without support (and
// visitors who asked for less motion) just see the page (knowledge base §7.7 [verified · s07-n1 T15]).
// animation-timeline and animation-range come AFTER the animation shorthand, which resets them.
// Plain colours, no var(): a pasted sheet doesn't define --gold.

import { n } from '../css.js';

const guard = (timeline, rules) =>
  `@media (prefers-reduced-motion:no-preference){@supports (animation-timeline:${timeline}){${rules}}}`;

// Game cards (profile) and the description / post text (project, devlog) slide in as they enter the
// viewport. `translate`, not transform: it adds to the owner's own card tilt instead of replacing it.
export function reveal() {
  return [
    '@keyframes custom-reveal{from{opacity:0;translate:0 24px}}',
    guard(
      'view()',
      '#wrapper .game_cell,#wrapper .user_formatted>*{animation:custom-reveal linear both;' +
        'animation-timeline:view();animation-range:entry 0% cover 30%}',
    ),
  ];
}

// A bar along the top that fills as the page scrolls. scroll(root): the page, not an inner box.
// It uses #wrapper::after, so it can't go with `ascii`, which paints on both pseudo-elements.
// options: { color: '#rrggbb' (the buttons' colour by default), height: 1–10 px (4 by default) }
export function progress({ color = '#2f27ce', height = 4 } = {}) {
  if (!/^#[0-9a-f]{6}$/i.test(color)) throw new Error('progress: color must be #rrggbb');
  if (!(height >= 1 && height <= 10)) throw new Error('progress: height must be between 1 and 10 px');
  return [
    '@keyframes custom-progress{from{transform:scaleX(0)}}',
    guard(
      'scroll()',
      `#wrapper::after{content:"";position:fixed;top:0;left:0;right:0;height:${n(height)}px;z-index:9;` +
        `background:${color};transform-origin:0 50%;pointer-events:none;` +
        'animation:custom-progress linear both;animation-timeline:scroll(root)}',
    ),
  ];
}

// The header (profile name, game banner and title) drifts down slower than the page and fades out
// over the first 300 px of scrolling. #profile_header and #header are stable ids (R12).
export function parallax() {
  return [
    '@keyframes custom-parallax{to{opacity:0;translate:0 60px}}',
    guard(
      'scroll()',
      '#wrapper #profile_header,#wrapper #header{animation:custom-parallax linear both;' +
        'animation-timeline:scroll(root);animation-range:0px 300px}',
    ),
  ];
}
