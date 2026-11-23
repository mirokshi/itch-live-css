// /api/validate — POST { css, page, html?, banner?, html5? } → { problems: [{ rule, level, message, title }] }: the
// engine's validator on the user's own CSS, as served through the link (so the profile size cap
// doesn't apply), plus whether each @import answers 2xx text/css and, with the user's HTML, whether
// the page shows exactly one h1 (R20; banner: the theme has one, html5: the project's game is HTML5).
// A devlog uses its project's CSS, so it's checked as a project. title is the rule's headline in the
// knowledge base (§0 of knowledge/itch-custom-css.md).

import { readFileSync } from 'node:fs';
import { checkHeadings, checkImports, validate } from '../../engine/src/index.js';
import { PAGES } from '../lib/config.js';
import { BadRequest, handle, json, readJson } from '../lib/http.js';
import { load } from '../lib/imports.js';

// rule id → "N. **Title**" from §0. shortcut: read at start-up; if the file isn't deployed, the
// problems still come, without titles.
const TITLES = {};
try {
  const md = readFileSync(new URL('../../knowledge/itch-custom-css.md', import.meta.url), 'utf8');
  const start = md.indexOf('## 0.');
  const rules = md.slice(start, md.indexOf('\n## ', start + 5));
  for (const m of rules.matchAll(/^(\d+)\. \*\*(.+?)\*\*/gm)) TITLES[`R${m[1]}`] = m[2].replaceAll('`', '');
} catch {}

export const POST = (request) =>
  handle(async () => {
    const { css, page = 'profile', html = '', banner = false, html5 = false } = (await readJson(request)) ?? {};
    if (typeof css !== 'string' || css.length > 50000) throw new BadRequest('css: text of at most 50000 characters');
    if (typeof html !== 'string' || html.length > 50000) throw new BadRequest('html: text of at most 50000 characters');
    if (!PAGES.includes(page)) throw new BadRequest(`page must be one of ${PAGES.join(', ')}`);
    // R10's status and type need the @imports' answers (lib/imports.js: public hosts only, cached)
    const checked = [...validate(css, page === 'profile' ? 'profile' : 'project', { served: true }), ...(await checkImports(css, load))];
    // without the user's HTML the page's h1s can't be counted
    if (html.trim()) checked.push(...checkHeadings({ html, css, page, banner: banner === true, html5: html5 === true }));
    const problems = checked.map((p) => ({ ...p, title: TITLES[p.rule] ?? '' }));
    return json({ problems });
  });
