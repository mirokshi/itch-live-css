// Static effects without a scroll timeline. Like scroll.js, plain CSS that is pasted, no link.

// Cross-document view transitions: going between the creator's pages (profile ⇄ own projects)
// cross-fades instead of flashing. Needs the rule on both pages [verified · support-21]; only
// same-origin navigations, so pages on other subdomains just load as usual.
export function pagefade() {
  return ['@media (prefers-reduced-motion:no-preference){@view-transition{navigation:auto}}'];
}

// The card's cover lifts with a shadow on hover (where the device has hover) and on keyboard focus
// (R18). The cover moves, not the card, so it doesn't fight the card's own scroll animations.
export function lift() {
  const up = 'translate:0 -6px;box-shadow:0 12px 24px rgba(0,0,0,.25)';
  return [
    '#wrapper .game_cell .game_thumb{transition:translate .25s ease,box-shadow .25s ease}',
    `@media (hover:hover){#wrapper .game_cell:hover .game_thumb{${up}}}`,
    `#wrapper .game_cell:focus-within .game_thumb{${up}}`,
    '@media (prefers-reduced-motion:reduce){#wrapper .game_cell .game_thumb{transition:none}}',
  ];
}

// Each card leans a little, a new angle per card on every load, with native random(): no service.
// Chrome/Edge 156+ and Safari 26.2+; elsewhere the @supports fails and the cards stay straight
// [verified 2026-10-29 · support-62; unnamed random() is per element · support-56].
export function tilt() {
  return ['@supports (rotate:random(0deg,1deg)){#wrapper .game_cell{rotate:random(-2.5deg,2.5deg)}}'];
}

// The page title (and the profile banner) scale and fade in once, as the page opens.
export function entrance() {
  return [
    '@keyframes custom-entrance{from{opacity:0;scale:.92;translate:0 12px}}',
    '@media (prefers-reduced-motion:no-preference){#wrapper #profile_header h1,#wrapper #profile_header .image_header,' +
      '#wrapper #header h1{animation:custom-entrance .7s cubic-bezier(.2,.7,.2,1) both}}',
  ];
}
