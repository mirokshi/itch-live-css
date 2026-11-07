// What the editor gives for itch's CSS field: the user's CSS minified, to paste, or the @import
// link. Effects change on every visit, so they need the link. Without them the CSS is pasted when
// it fits: a profile takes 5,120 UTF-8 bytes (knowledge base R7), a game page any size; a devlog
// uses its game's CSS. Pasting is safer than the link: an @import blocks the page until it answers.

import { minify } from '../../engine/src/css.js';
import { measure } from '../../engine/src/output.js';

// form: the config the editor saves ({ page, title, greeting, cards, ascii, css }).
// → { mode: 'import', reason: 'effects' | 'size', bytes?, max? } | { mode: 'paste', css, bytes, max }
export function exportFor(form) {
  if (form.title || form.greeting || form.cards || form.ascii) return { mode: 'import', reason: 'effects' };
  const css = minify(form.css);
  const { bytes, limit, fits } = measure(css, form.page === 'profile' ? 'profile' : 'project');
  const max = limit?.max ?? null;
  return fits ? { mode: 'paste', css, bytes, max } : { mode: 'import', reason: 'size', bytes, max };
}
