// Validator: checks CSS against the knowledge base's rules (knowledge/itch-custom-css.md §0, R1–R24).
// Each problem carries its rule id, so the reason and the evidence are one lookup away.
// So far the cheap ones: R2–R4, R7–R10, R11 (only its ad-block part, ROADMAP H8), R12, R14 (outline
// and animated properties), R15, R16, R18, R23.

import { measure } from './output.js';

// CSS → nodes: { prelude, block } for anything with a body, { prelude } for statements ending in
// ";". Comments are dropped; strings and unquoted url(...) stay whole, so braces inside don't count.
function parse(css) {
  let i = 0;
  function nodes(nested) {
    const out = [];
    let text = '';
    const flush = () => {
      if (text.trim()) out.push({ prelude: text.trim() });
      text = '';
    };
    while (i < css.length) {
      const c = css[i];
      if (c === '/' && css[i + 1] === '*') {
        const end = css.indexOf('*/', i + 2);
        i = end < 0 ? css.length : end + 2;
        text += ' ';
      } else if (c === '"' || c === "'") {
        const start = i++;
        while (i < css.length && css[i] !== c && css[i] !== '\n') i += css[i] === '\\' ? 2 : 1;
        text += css.slice(start, ++i);
      } else if ((c === 'u' || c === 'U') && /^url\(\s*[^\s'"]/i.test(css.slice(i, i + 64))) {
        const end = css.indexOf(')', i);
        const start = i;
        i = end < 0 ? css.length : end + 1;
        text += css.slice(start, i);
      } else if (c === '{') {
        i++;
        out.push({ prelude: text.trim(), block: nodes(true) });
        text = '';
      } else if (c === '}') {
        i++;
        if (nested) break;
        text = ''; // a stray } at the top: nothing to keep
      } else if (c === ';') {
        i++;
        flush();
      } else {
        text += c;
        i++;
      }
    }
    flush();
    return out;
  }
  return nodes(false);
}

const atName = (node) => /^@([\w-]+)/.exec(node.prelude)?.[1].toLowerCase();

// at-rules whose body holds ordinary style rules (@scope is left out: its selectors are relative)
const GROUPS = new Set(['media', 'supports', 'container', 'layer', 'starting-style']);

function* walk(nodes) {
  for (const node of nodes) {
    yield node;
    if (node.block) yield* walk(node.block);
  }
}

// style rules at the top or inside group at-rules; rules nested in a style rule are relative
function* styleRules(nodes) {
  for (const node of nodes) {
    if (!node.block) continue;
    if (!node.prelude.startsWith('@')) yield node;
    else if (GROUPS.has(atName(node))) yield* styleRules(node.block);
  }
}

// every style rule, nested ones too, with whether it sits in @media (prefers-reduced-motion:reduce)
// and in @media (hover:hover)
function* allRules(nodes, reduced = false, hover = false) {
  for (const node of nodes) {
    if (!node.block) continue;
    if (!node.prelude.startsWith('@')) {
      yield { node, reduced, hover };
      yield* allRules(node.block, reduced, hover);
    } else if (GROUPS.has(atName(node))) {
      yield* allRules(
        node.block,
        reduced || /prefers-reduced-motion\s*:\s*reduce/i.test(node.prelude),
        hover || /^@media\b.*\(\s*(any-)?hover\s*(:\s*hover\s*)?\)/i.test(node.prelude),
      );
    }
  }
}

// a rule's own declarations → [{ prop, value, important }] (custom property names keep their case)
const declarations = (node) =>
  node.block.flatMap(({ prelude, block }) => {
    const k = prelude.indexOf(':');
    if (block || k < 0) return [];
    const prop = prelude.slice(0, k).trim();
    const value = prelude.slice(k + 1).trim();
    return [{ prop: prop.startsWith('--') ? prop : prop.toLowerCase(), value, important: /!\s*important$/i.test(value) }];
  });

const KEYFRAMES = /^@(?:-webkit-)?keyframes\s+(\S+)/i;

// a, b:is(c, d) → ['a', 'b:is(c, d)']
function selectors(prelude) {
  const out = [];
  let depth = 0;
  let start = 0;
  for (let k = 0; k < prelude.length; k++) {
    const c = prelude[k];
    if (c === '(' || c === '[') depth++;
    else if (c === ')' || c === ']') depth--;
    else if (c === ',' && !depth) {
      out.push(prelude.slice(start, k).trim());
      start = k + 1;
    }
  }
  out.push(prelude.slice(start).trim());
  return out;
}

const short = (s) => (s.length > 80 ? `${s.slice(0, 77)}...` : s);

// the values of every url(...) in a prelude, quoted or not
const urls = (text) =>
  [...text.matchAll(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^)'"\s]*))\s*\)/gi)].map((m) => m[1] ?? m[2] ?? m[3]);

// @import url("x") / @import "x" → x
function importUrl(prelude) {
  const rest = prelude.replace(/^@import\s*/i, '');
  return /^url\(/i.test(rest) ? urls(rest)[0] : /^(["'])(.*?)\1/.exec(rest)?.[2];
}

const absolute = (url) => /^(https:\/\/|data:)/i.test(url);

// jsDelivr caches a tag or full SHA for a year, but a branch, a short SHA or no ref only for up to
// 12 h (CDN) and 7 days (browser), so visitors see different versions (knowledge base §8)
function unpinned(url) {
  const m = /^https:\/\/cdn\.jsdelivr\.net\/(?:gh\/[^/]+\/[^/@]+|npm\/(?:@[^/]+\/)?[^/@]+)(?:@([^/]*))?/i.exec(url);
  return !!m && (!m[1] || /^(main|master|latest)$/i.test(m[1]) || /^[0-9a-f]{7,39}$/i.test(m[1]));
}

// page: profile | project | jam. served: the CSS comes through @import, so the size cap doesn't apply.
// → [{ rule: 'R2', level: 'error' | 'warning', message }]
export function validate(css, page, { served = false } = {}) {
  const problems = [];
  const add = (rule, level, message) => problems.push({ rule, level, message });
  const top = parse(css);

  if (!served) {
    const { bytes, chars, limit, fits } = measure(css, page);
    if (fits === false) add('R7', 'error', `${bytes} bytes, over the ${page} cap of ${limit.max}: itch refuses the save`);
    if (fits === null) add('R7', 'warning', `${chars} characters, past the ${limit.max} known to save on a jam`);
  }

  // R8 on the raw text: itch deletes </style> even inside comments and strings
  if (/<\/?style\b/i.test(css)) {
    add('R8', 'error', 'remove every <style> and </style>: itch deletes </style> (any case), which changes the CSS around it');
  }

  // R2, and R3 where the unscoped rule sets variables
  for (const rule of styleRules(top)) {
    const vars = declarations(rule).filter((d) => d.prop.startsWith('--'));
    for (const sel of selectors(rule.prelude)) {
      if (vars.length && /^(:root|html)(?![\w-])/.test(sel)) {
        add('R3', 'error', `"${short(sel)}" sets variables: set them on #wrapper or below (on :root they recoloured itch's jam header)`);
      } else if (!/^(body\.frame_maximized\s+)?#wrapper(?![\w-])/.test(sel)) {
        add('R2', 'error', `"${short(sel)}" must start with #wrapper: itch serves your CSS page-wide`);
      } else if (page === 'profile' && sel === '#wrapper' && vars.some((d) => d.prop.startsWith('--itchio_'))) {
        add('R3', 'warning', "itch declares a profile's --itchio_ variables on .user_page, which beats #wrapper: set them on #wrapper .user_page");
      }
      // R4: the #wrapper box itself (classes and states allowed; descendants and pseudo-elements are other boxes)
      const outer = sel.replace(/\([^()]*\)/g, '()').replace(/\([^()]*\)/g, '()');
      if (/^(body\.frame_maximized\s+)?#wrapper[^\s>+~]*$/.test(outer) && !/::|:(before|after|first-line|first-letter)\b/i.test(outer) &&
        declarations(rule).some((d) => d.prop === 'background')) {
        add('R4', 'error', `"${short(sel)}" uses the background shorthand, which wipes the creator's background image: use background-* longhands (B3)`);
      }
    }
  }

  // R9: before an @import only comments, @charset and @layer statements; an @layer statement
  // between two imports keeps the later one from applying
  let open = true;
  let imported = false;
  let layerAfterImport = false;
  for (const node of top) {
    const at = atName(node);
    if (at === 'import' && !node.block) {
      const what = short(node.prelude);
      if (page === 'jam') add('R9', 'error', `${what}: @import never loads on a jam; use @font-face for fonts`);
      else if (!open) add('R9', 'error', `${what} comes after other rules, so browsers ignore it: put every @import first`);
      else if (layerAfterImport) add('R9', 'error', `${what} follows an @layer statement that sits between imports: it loads but never applies`);
      if (/\blayer\b/i.test(node.prelude.replace(/"[^"]*"|'[^']*'|url\([^)]*\)/gi, ''))) {
        add('R15', 'warning', `${what}: imported into a layer, its rules always lose to itch's`);
      }
      // R10
      const url = importUrl(node.prelude) ?? '';
      if (!absolute(url)) {
        add('R10', 'error', `${what}: import an absolute https:// URL; http:// is blocked as mixed content and a relative one points at itch`);
      } else if (/^https:\/\/(raw|gist)\.githubusercontent\.com\//i.test(url)) {
        add('R10', 'error', `${what}: served as text/plain, so browsers ignore it; use https://cdn.jsdelivr.net/gh/USER/REPO@TAG/file.css`);
      } else if (unpinned(url)) {
        add('R10', 'warning', `${what}: not pinned to a tag or full SHA, so visitors may get different versions for days`);
      }
      imported = true;
    } else if (at === 'layer' && !node.block) {
      if (imported) layerAfterImport = true;
    } else if (at !== 'charset') {
      open = false;
    }
  }

  // R11, R12 and R14, over every style rule
  const animated = new Set();
  for (const node of walk(top)) {
    if (node.block && KEYFRAMES.test(node.prelude)) {
      for (const frame of node.block) if (frame.block) for (const d of declarations(frame)) animated.add(d.prop);
    }
  }
  animated.delete('animation-timing-function');
  const adBlocked = new Set();
  const numbered = new Set();
  const frozen = new Set();
  const ungated = new Set();
  const hovers = new Set();
  const seen = new Set();
  for (const { node, reduced, hover } of allRules(top)) {
    for (const sel of selectors(node.prelude)) {
      const s = sel.replace(/\s+/g, ' ');
      seen.add(s);
      if (/:hover\b/.test(s)) {
        hovers.add(s);
        if (!hover) ungated.add(s);
      }
    }
    // R11: ad-block filter lists hide these class names from visitors who use them
    for (const m of node.prelude.matchAll(/\.(custom-(?:ad|social|share|cookie)[\w-]*)/g)) adBlocked.add(m[1]);
    const bare = node.prelude.replace(/\[[^\]]*\]|"[^"]*"|'[^']*'/g, '');
    for (const m of bare.matchAll(/#(-?[A-Za-z_][\w-]*\d[\w-]*)/g)) numbered.add(m[1]);
    for (const { prop, value, important } of declarations(node)) {
      if (!important) continue;
      if ((prop === 'outline' || prop === 'outline-style') && /^(none|0)\b/i.test(value)) {
        add('R14', 'error', `${prop}:${short(value)} hides the focus ring for keyboard users; restyle it instead (B2)`);
      }
      // in a reduced-motion block, freezing the motion is the point
      if (animated.has(prop) && !reduced) frozen.add(prop);
    }
  }

  const relative = new Set();
  for (const node of walk(top)) {
    const at = atName(node);
    if (at === 'import' && !top.includes(node)) add('R9', 'error', `${short(node.prelude)} sits inside a block, where @import is invalid`);
    // R23 (imports are R10's)
    if (at !== 'import') for (const url of urls(node.prelude)) if (!absolute(url)) relative.add(url);
    if (at === 'layer' && node.block) {
      add('R15', 'warning', `${short(node.prelude)}: layered rules always lose to itch's unlayered ones`);
    }
    // R16
    const name = KEYFRAMES.exec(node.prelude)?.[1].replace(/^["']|["']$/g, '');
    if (name && node.block && !name.startsWith('custom-')) {
      add('R16', 'error', `@keyframes ${name} needs the custom- prefix: if itch uses the same name, yours replaces its animation page-wide`);
    }
  }
  for (const url of relative) {
    add('R23', 'error', `url(${short(url)}): use an absolute https:// URL (or data:); a relative one points at itch and http:// is blocked`);
  }
  for (const name of adBlocked) {
    add('R11', 'warning', `.${name}: ad blockers hide classes starting custom-ad, custom-social, custom-share or custom-cookie`);
  }
  for (const id of numbered) {
    add('R12', 'error', `#${id}: numbered ids change from page to page; use a stable one (#wrapper, #inner_column, #profile_header…) or a class`);
  }
  // shortcut: matched by property name across the sheet, not by element, so it can flag an
  // !important on an element that never runs the animation; hence a warning
  for (const prop of frozen) {
    add('R14', 'warning', `${prop} !important: your @keyframes animate ${prop}, and !important beats animations, so it can freeze them`);
  }
  // R18: on touch screens a tap leaves :hover stuck; keyboard users need the same effect on focus
  for (const s of ungated) {
    add('R18', 'warning', `"${short(s)}": put hover effects inside @media (hover:hover)`);
  }
  for (const s of hovers) {
    const twins = [':focus', ':focus-visible', ':focus-within'].map((f) => s.replace(/:hover\b/g, f));
    if (!/:focus/.test(s) && !twins.some((t) => seen.has(t))) {
      add('R18', 'warning', `"${short(s)}" has no focus twin: give it the same effect on :focus-visible`);
    }
  }
  return problems;
}
