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

// Prefix every @keyframes name needs, so it can't replace one of itch's global animations.
export const KEYFRAMES_PREFIX = 'custom-';

export const SOURCES = {
  LIMITS: { rule: 'R7', facts: ['live-cap-A1', 'live-cap-A2c', 'live-cap-B1', 'live-cap-B2', 'crawljam-29'] },
  AD_BLOCKED: { rule: 'R11', facts: ['docs-34', 'sanitizer-05', 'gapfill05-06', 'external-30', 'x08-07'] },
  KEYFRAMES_PREFIX: { rule: 'R16', facts: ['s06-static', 's06-kf'] },
};
