// Evidence-backed data the validator and measure() read. Each constant names its rule in §0 of
// knowledge/itch-custom-css.md and the fact ids it rests on (SOURCES); test/rules.test.js checks
// both against the main file, so a change there fails until this file follows.

// itch's CSS size limits per page type. Devlog posts have no CSS field of their own: they use the
// project's.
export const LIMITS = {
  profile: { max: 5120, unit: 'bytes', exact: true }, // over it the save is refused, not truncated
  project: null, // no cap: 659,742 characters saved, bigger saves fail as a request
  jam: { max: 20410, unit: 'chars', exact: false }, // known to save; the real cap is unmeasured
};

// Class-name starts that ad-block filter lists hide (exact names like custom-ad, custom-cookie-banner).
export const AD_BLOCKED = ['custom-ad', 'custom-social', 'custom-share', 'custom-cookie'];

// What itch's sanitizer keeps of page HTML: classes starting with lowercase "custom", plus these of its
// own (and language-* on <code>) [§5: live-k22 to live-k25, live-k34, live-t03]; it strips these
// attributes, tabindex except on .spoiler [§5: live-a01 to live-a07, live-a11 to live-a20].
export const KEPT_CLASSES = ['text-center', 'text-justify', 'text-right', 'spoiler'];
export const STRIPPED_ATTRS = /^(id|role|tabindex|hidden|inert|accesskey|contenteditable|draggable|translate|on\w+|popover\w*|data-[\w-]*|aria-[\w-]*)$/i;

// Prefix every @keyframes name needs, so it can't replace one of itch's global animations.
export const KEYFRAMES_PREFIX = 'custom-';

// itch's own UI, which CSS may restyle but never hide or relabel: footers, site headers, user tools,
// dialogs, buy/download rows and buttons, files, prices, "More information" and the click-to-activate
// placeholder. The header, tools and dialogs sit outside #wrapper, so R2 flags them too. Every name is
// in sections 02 and 03 (test/rules.test.js checks it).
export const ITCH_UI = [
  '.footer', '#view_game_footer', '.itch_footer',
  '.header_widget', '.primary_header', '.game_header_widget', '.jam_layout_header_widget', '#user_tools',
  '#lightbox_container',
  '.buy_row', '.header_buy_row', '.direct_download_row', '.bundle_row', '.donate',
  '.buy_btn', '.download_btn', '.direct_download_btn', '.donate_btn', '.upload', '.upload_list_widget',
  '.price_tag', '.price_value', '.dollars',
  '.more_information_toggle', '.info_panel_wrapper', '.game_info_panel_widget',
  '.embed_preload',
];

// The HTML5 game's ancestors on a project page (#inner_column is also .inner_column there). A
// containing block or stacking context on one of them traps the game when itch maximizes it.
export const EMBED_ANCESTORS = ['#wrapper', '#inner_column', '.inner_column', '.view_game_page', '.embed_wrapper'];

export const SOURCES = {
  EMBED_ANCESTORS: { rule: 'R22', facts: ['s04-gf-08', 's04-gf-09', 's04-gf-11'] },
  LIMITS: { rule: 'R7', facts: ['live-cap-A1', 'live-cap-A2c', 'live-cap-B1', 'live-cap-B2', 'crawljam-29'] },
  ITCH_UI: { rule: 'R5', facts: ['docs-10', 'docs-11', 'docs-12', 'community-23', 'community-24', 'itchcss-46', 'crawljam-24'] },
  STRIPPED_ATTRS: { rule: 'R11', facts: ['live-a01', 'live-a06', 'live-a11'] },
  AD_BLOCKED: { rule: 'R11', facts: ['docs-34', 'sanitizer-05', 'gapfill05-06', 'external-30', 'x08-07'] },
  KEYFRAMES_PREFIX: { rule: 'R16', facts: ['s06-static', 's06-kf'] },
};
