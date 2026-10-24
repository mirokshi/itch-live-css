// The user's own hand-written CSS, minified. It lands where it sits in the config, so a stylesheet
// with @import lines goes first (R9).
//
// options:
//   css  'string'  the stylesheet

import { minify } from '../css.js';

export function css({ css }) {
  if (typeof css !== 'string') throw new Error('css: needs css (text)');
  const out = minify(css);
  return out ? [out] : [];
}
