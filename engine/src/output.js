// What goes into itch's CSS field: the @import line of the served output, and the size check.

// itch's CSS size limits per page type (knowledge base R7; profile and project measured 2026-10-16)
import { LIMITS } from './rules.js';

// The line to paste into itch for the served output. It must come first in the pasted CSS (R9) and
// only https:// loads (R10, R23). URL encodes quotes and drops line breaks; backslashes are encoded
// by hand because a query keeps them and CSS would read them as escapes.
export function importLine(url) {
  const u = new URL(url);
  if (u.protocol !== 'https:') throw new Error(`importLine: needs an https:// URL, not ${u.protocol}`);
  return `@import url("${u.href.replaceAll('\\', '%5C')}");`;
}

// Size of css as itch stores it on that page type: edge whitespace trimmed, comments counted,
// projects in CRLF, profiles in LF. chars are code points.
// fits: true or false; null past a jam's known-good size, where nobody knows.
// shortcut: a profile's line breaks count 1 byte (as stored); whether the cap counts the CRLF the
// form submits is unmeasured. Probe it if a profile near the cap keeps line breaks.
export function measure(css, page) {
  if (!Object.hasOwn(LIMITS, page)) throw new Error(`measure: page must be profile, project or jam, not "${page}"`);
  let text = css.trim().replace(/\r\n?/g, '\n');
  if (page === 'project') text = text.replaceAll('\n', '\r\n');
  const chars = [...text].length;
  const bytes = new TextEncoder().encode(text).length;
  const limit = LIMITS[page];
  if (!limit) return { page, chars, bytes, limit, fits: true };
  const size = limit.unit === 'bytes' ? bytes : chars;
  return { page, chars, bytes, limit, fits: size <= limit.max ? true : limit.exact ? false : null };
}
