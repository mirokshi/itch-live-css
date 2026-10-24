// Validator: checks CSS against the knowledge base's rules (knowledge/itch-custom-css.md §0, R1–R24).
// Each problem carries its rule id, so the reason and the evidence are one lookup away.
// So far the cheap ones: R2, R7, R8, R9, R15, R16.

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

  // R2
  for (const rule of styleRules(top)) {
    for (const sel of selectors(rule.prelude)) {
      if (!/^(body\.frame_maximized\s+)?#wrapper(?![\w-])/.test(sel)) {
        add('R2', 'error', `"${short(sel)}" must start with #wrapper: itch serves your CSS page-wide`);
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
      imported = true;
    } else if (at === 'layer' && !node.block) {
      if (imported) layerAfterImport = true;
    } else if (at !== 'charset') {
      open = false;
    }
  }

  for (const node of walk(top)) {
    const at = atName(node);
    if (at === 'import' && !top.includes(node)) add('R9', 'error', `${short(node.prelude)} sits inside a block, where @import is invalid`);
    if (at === 'layer' && node.block) {
      add('R15', 'warning', `${short(node.prelude)}: layered rules always lose to itch's unlayered ones`);
    }
    // R16
    const name = /^@(?:-webkit-)?keyframes\s+(\S+)/i.exec(node.prelude)?.[1].replace(/^["']|["']$/g, '');
    if (name && node.block && !name.startsWith('custom-')) {
      add('R16', 'error', `@keyframes ${name} needs the custom- prefix: if itch uses the same name, yours replaces its animation page-wide`);
    }
  }
  return problems;
}
