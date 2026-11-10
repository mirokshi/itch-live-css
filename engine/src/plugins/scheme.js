// Light and dark by the visitor's system. Light stays as the theme editor sets it; in dark the page,
// text, links and cards' variables change. Static (no per-visit randomness), so it can be pasted.
// itch declares no color-scheme (§0), so it is set here for form controls and scrollbars.
// Plain colours, no var(): a pasted sheet doesn't define --gold.

export function scheme() {
  return [
    '#wrapper{color-scheme:light dark}',
    '@media (prefers-color-scheme:dark){' +
      '#wrapper{--ink:#e8e8ee;--line:rgba(255,255,255,.14);background-color:#15151a}' +
      '#wrapper .user_page,#wrapper .inner_column{color:#e8e8ee}' +
      '#wrapper .inner_column{background-color:rgba(30,30,38,.92)}' +
      '#wrapper a{color:#ff9ec4}}',
  ];
}
