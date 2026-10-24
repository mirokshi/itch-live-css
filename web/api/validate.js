// /api/validate — POST { css } → { problems: [{ rule, level, message, title }] }: the engine's
// validator on the user's own CSS, as served through the link (so the profile size cap doesn't
// apply). title is the rule's headline in the knowledge base (§0 of knowledge/itch-custom-css.md).

import { readFileSync } from 'node:fs';
import { validate } from '../../engine/src/index.js';
import { BadRequest, handle, json, readJson } from '../lib/http.js';

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
    const { css } = (await readJson(request)) ?? {};
    if (typeof css !== 'string' || css.length > 50000) throw new BadRequest('css: text of at most 50000 characters');
    const problems = validate(css, 'profile', { served: true }).map((p) => ({ ...p, title: TITLES[p.rule] ?? '' }));
    return json({ problems });
  });
