// Validator: checks CSS against the knowledge base's rules (knowledge/itch-custom-css.md §0, R1–R24).
// Each problem carries its rule id, so the reason and the evidence are one lookup away.
// So far the cheap ones: R2–R4, R7–R10, R11 (only its ad-block part, ROADMAP H8), R12, R14 (outline
// and animated properties), R15, R16, R18, R23.
//
// The rules are a PostCSS plugin, itchRules(): one visitor per node type, with Once/OnceExit for the
// rules that need the whole sheet. validate() runs it over the tolerant parser, so problems still
// show while the CSS is half-typed (decisions/0001-postcss-validator.md).

import postcss from 'postcss';
import safeParser from 'postcss-safe-parser';
import { measure } from './output.js';
import MESSAGES from './messages.json' with { type: 'json' };
import { AD_BLOCKED, KEYFRAMES_PREFIX } from './rules.js';

// The English text of a problem: messages.json[code] with its {{params}} filled in. The web shows the
// same code in the viewer's language (its locales use the same keys and placeholders).
export function text(code, params) {
  const template = code.split('.').reduce((o, k) => o?.[k], MESSAGES);
  if (typeof template !== 'string') throw new Error(`validate: no message "${code}"`);
  return template.replace(/\{\{(\w+)\}\}/g, (_, k) => String(params[k]));
}

// at-rules whose body holds ordinary style rules (@scope is left out: its selectors are relative)
const GROUPS = new Set(['media', 'supports', 'container', 'layer', 'starting-style']);

const KEYFRAMES = /^(-webkit-)?keyframes$/i;
const AD_CLASS = new RegExp(`\\.((?:${AD_BLOCKED.join('|')})[\\w-]*)`, 'g');

// Where a style rule sits: null if it isn't one (a keyframe, or inside @font-face, @scope…).
// nested: inside another style rule, so its selectors are relative. reduced, hover: inside
// @media (prefers-reduced-motion:reduce) or @media (hover:hover).
function context(node) {
  const ctx = { nested: false, reduced: false, hover: false };
  for (let p = node.parent; p && p.type !== 'root'; p = p.parent) {
    if (p.type === 'rule') ctx.nested = true;
    else if (p.type === 'atrule' && GROUPS.has(p.name.toLowerCase())) {
      ctx.reduced ||= /prefers-reduced-motion\s*:\s*reduce/i.test(p.params);
      ctx.hover ||= p.name.toLowerCase() === 'media' && /\(\s*(any-)?hover\s*(:\s*hover\s*)?\)/i.test(p.params);
    } else return null;
  }
  return ctx;
}

// custom property names keep their case
const propOf = (decl) => (decl.prop.startsWith('--') ? decl.prop : decl.prop.toLowerCase());
const declarations = (rule) => rule.nodes.filter((n) => n.type === 'decl');

const short = (s) => (s.length > 80 ? `${s.slice(0, 77)}...` : s);
// an at-rule's prelude as written: "@import url(x)", "@import"x""
const statement = (at) => `@${at.name}${at.raws.afterName ?? ' '}${at.params}`.trim();

// the values of every url(...) in a text, quoted or not
const urls = (text) =>
  [...text.matchAll(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^)'"\s]*))\s*\)/gi)].map((m) => m[1] ?? m[2] ?? m[3]);

// @import's params: url("x") / "x" → x
const importUrl = (params) => (/^url\(/i.test(params) ? urls(params)[0] : /^(["'])(.*?)\1/.exec(params)?.[2]);

const absolute = (url) => /^(https:\/\/|data:)/i.test(url);

// jsDelivr caches a tag or full SHA for a year, but a branch, a short SHA or no ref only for up to
// 12 h (CDN) and 7 days (browser), so visitors see different versions (knowledge base §8)
function unpinned(url) {
  const m = /^https:\/\/cdn\.jsdelivr\.net\/(?:gh\/[^/]+\/[^/@]+|npm\/(?:@[^/]+\/)?[^/@]+)(?:@([^/]*))?/i.exec(url);
  return !!m && (!m[1] || /^(main|master|latest)$/i.test(m[1]) || /^[0-9a-f]{7,39}$/i.test(m[1]));
}

// page: profile | project | jam. served: the CSS comes through @import, so the size cap doesn't apply.
// Problems are result.warn() messages carrying { rule, level }, positioned on their node.
export function itchRules({ page, served = false } = {}) {
  return {
    postcssPlugin: 'itch-rules',
    prepare(result) {
      // code: a key of messages.json; range: { word } or { index, endIndex } inside the node's text,
      // to narrow the position
      const add = (rule, level, code, params = {}, node, range) => result.warn(text(code, params), { node, ...range, rule, level, code, params });
      const animated = new Set();
      // value → first node it was seen on; reported once per sheet in OnceExit
      const relative = new Map();
      const adBlocked = new Map();
      const numbered = new Map();
      const frozen = new Map();
      const ungated = new Map();
      const hovers = new Map();
      const seen = new Set();
      const first = (map, key, node) => map.has(key) || map.set(key, node);
      const relativeUrls = (text, node) => {
        for (const url of urls(text)) if (!absolute(url)) first(relative, url, node);
      };

      return {
        Once(root) {
          const css = root.source?.input.css ?? root.toString();
          // R7 and R8 on the raw text: itch counts and deletes what the tree normalises away
          if (!served) {
            const { bytes, chars, limit, fits } = measure(css, page);
            if (fits === false) add('R7', 'error', 'R7.cap', { bytes, page, max: limit.max });
            if (fits === null) add('R7', 'warning', 'R7.jam', { chars, max: limit.max });
          }
          if (/<\/?style\b/i.test(css)) {
            add('R8', 'error', 'R8.style');
          }

          // R9: before an @import only comments, @charset and @layer statements; an @layer statement
          // between two imports keeps the later one from applying
          let open = true;
          let imported = false;
          let layerAfterImport = false;
          for (const node of root.nodes) {
            if (node.type === 'comment') continue;
            const at = node.type === 'atrule' ? node.name.toLowerCase() : null;
            if (at === 'import' && !node.nodes) {
              const what = short(statement(node));
              if (page === 'jam') add('R9', 'error', 'R9.jam', { what }, node);
              else if (!open) add('R9', 'error', 'R9.order', { what }, node);
              else if (layerAfterImport) add('R9', 'error', 'R9.layer', { what }, node);
              if (/\blayer\b/i.test(node.params.replace(/"[^"]*"|'[^']*'|url\([^)]*\)/gi, ''))) {
                add('R15', 'warning', 'R15.import', { what }, node);
              }
              // R10
              const url = importUrl(node.params) ?? '';
              if (!absolute(url)) {
                add('R10', 'error', 'R10.absolute', { what }, node);
              } else if (/^https:\/\/(raw|gist)\.githubusercontent\.com\//i.test(url)) {
                add('R10', 'error', 'R10.raw', { what }, node);
              } else if (unpinned(url)) {
                add('R10', 'warning', 'R10.unpinned', { what }, node);
              }
              imported = true;
            } else if (at === 'layer' && !node.nodes) {
              if (imported) layerAfterImport = true;
            } else if (at !== 'charset') {
              open = false;
            }
          }

          // R14 needs every property the @keyframes animate before it meets an !important
          root.walkAtRules(KEYFRAMES, (at) => {
            at.walkDecls((d) => animated.add(propOf(d)));
          });
          animated.delete('animation-timing-function');
        },

        Rule(rule) {
          const ctx = context(rule);
          relativeUrls(rule.selector, rule);
          if (!ctx) return;
          const decls = declarations(rule);

          // R2, and R3 where the unscoped rule sets variables; nested rules are relative
          if (!ctx.nested) {
            const vars = decls.filter((d) => d.prop.startsWith('--'));
            // each selector's own span, so "b" in "#wrapper b, b" points at the second one
            let from = 0;
            for (const sel of rule.selectors) {
              const index = rule.selector.indexOf(sel, from);
              const spot = index < 0 ? { word: sel } : { index, endIndex: (from = index + sel.length) };
              if (vars.length && /^(:root|html)(?![\w-])/.test(sel)) {
                add('R3', 'error', 'R3.root', { sel: short(sel) }, rule, spot);
              } else if (!/^(body\.frame_maximized\s+)?#wrapper(?![\w-])/.test(sel)) {
                add('R2', 'error', 'R2.wrapper', { sel: short(sel) }, rule, spot);
              } else if (page === 'profile' && sel === '#wrapper' && vars.some((d) => d.prop.startsWith('--itchio_'))) {
                add('R3', 'warning', 'R3.profile', {}, rule, spot);
              }
              // R4: the #wrapper box itself (classes and states allowed; descendants and pseudo-elements are other boxes)
              const outer = sel.replace(/\([^()]*\)/g, '()').replace(/\([^()]*\)/g, '()');
              if (/^(body\.frame_maximized\s+)?#wrapper[^\s>+~]*$/.test(outer) && !/::|:(before|after|first-line|first-letter)\b/i.test(outer) &&
                decls.some((d) => propOf(d) === 'background')) {
                add('R4', 'error', 'R4.background', { sel: short(sel) }, rule, spot);
              }
            }
          }

          // R11, R12 and R18 collect here and report once per sheet
          for (const sel of rule.selectors) {
            const s = sel.replace(/\s+/g, ' ');
            seen.add(s);
            if (/:hover\b/.test(s)) {
              first(hovers, s, rule);
              if (!ctx.hover) first(ungated, s, rule);
            }
          }
          // R11: ad-block filter lists hide these class names from visitors who use them
          for (const m of rule.selector.matchAll(AD_CLASS)) first(adBlocked, m[1], rule);
          const bare = rule.selector.replace(/\[[^\]]*\]|"[^"]*"|'[^']*'/g, '');
          for (const m of bare.matchAll(/#(-?[A-Za-z_][\w-]*\d[\w-]*)/g)) first(numbered, m[1], rule);
        },

        AtRule(at) {
          const name = at.name.toLowerCase();
          if (name === 'import') {
            if (at.parent?.type !== 'root') add('R9', 'error', 'R9.nested', { what: short(statement(at)) }, at);
            return; // its URL is R10's
          }
          relativeUrls(at.params, at); // R23
          if (name === 'layer' && at.nodes) {
            add('R15', 'warning', 'R15.layer', { what: short(statement(at)) }, at, { word: '@' + at.name });
          }
          // R16
          if (KEYFRAMES.test(name) && at.nodes) {
            const kf = at.params.trim().split(/\s/)[0].replace(/^["']|["']$/g, '');
            if (kf && !kf.startsWith(KEYFRAMES_PREFIX)) {
              add('R16', 'error', 'R16.prefix', { name: kf, prefix: KEYFRAMES_PREFIX }, at, { word: kf });
            }
          }
        },

        Declaration(decl) {
          relativeUrls(decl.value, decl); // R23
          // R14, over the declarations of style rules
          if (!decl.important || decl.parent?.type !== 'rule') return;
          const ctx = context(decl.parent);
          if (!ctx) return;
          const prop = propOf(decl);
          if ((prop === 'outline' || prop === 'outline-style') && /^(none|0)\b/i.test(decl.value)) {
            // PostCSS keeps raws.important only when it differs from the default " !important"
            const value = decl.value + (decl.raws.important ?? ' !important');
            add('R14', 'error', 'R14.outline', { prop, value: short(value) }, decl);
          }
          // in a reduced-motion block, freezing the motion is the point
          if (animated.has(prop) && !ctx.reduced) first(frozen, prop, decl);
        },

        OnceExit() {
          for (const [url, node] of relative) {
            add('R23', 'error', 'R23.url', { url: short(url) }, node, { word: url });
          }
          for (const [name, node] of adBlocked) {
            add('R11', 'warning', 'R11.adblock', { name, names: AD_BLOCKED.slice(0, -1).join(', '), last: AD_BLOCKED.at(-1) }, node, { word: name });
          }
          for (const [id, node] of numbered) {
            add('R12', 'error', 'R12.numbered', { id }, node, { word: id });
          }
          // shortcut: matched by property name across the sheet, not by element, so it can flag an
          // !important on an element that never runs the animation; hence a warning
          for (const [prop, node] of frozen) {
            add('R14', 'warning', 'R14.frozen', { prop }, node);
          }
          // R18: on touch screens a tap leaves :hover stuck; keyboard users need the same effect on focus
          for (const [s, node] of ungated) {
            add('R18', 'warning', 'R18.gate', { sel: short(s) }, node);
          }
          for (const [s, node] of hovers) {
            const twins = [':focus', ':focus-visible', ':focus-within'].map((f) => s.replace(/:hover\b/g, f));
            if (!/:focus/.test(s) && !twins.some((t) => seen.has(t))) {
              add('R18', 'warning', 'R18.twin', { sel: short(s) }, node);
            }
          }
        },
      };
    },
  };
}
itchRules.postcss = true;

// The CSS browsers get: itch deletes every </style>, in any case and with inner spaces.
const asServed = (css) => css.replace(/<\/style\s*>/gi, '');

// → [{ rule: 'R2' | … | 'syntax', level: 'error' | 'warning', code, params, message, line?, column?, endLine?, endColumn? }]
export function validate(css, page, { served = false } = {}) {
  const problems = [];
  // the strict parser only adds a hint: browsers skip the broken part, itch saves it as it is
  try {
    postcss.parse(asServed(css));
  } catch (e) {
    if (e.name !== 'CssSyntaxError') throw e;
    problems.push({
      rule: 'syntax',
      level: 'error',
      code: 'syntax.broken',
      params: { reason: e.reason },
      message: text('syntax.broken', { reason: e.reason }),
      ...position(e),
    });
  }
  const result = postcss([itchRules({ page, served })]).process(css, { from: undefined, parser: safeParser }).sync();
  for (const w of result.messages) {
    if (w.type === 'warning') problems.push({ rule: w.rule, level: w.level, code: w.code, params: w.params, message: w.text, ...position(w) });
  }
  return problems;
}

const position = ({ line, column, endLine, endColumn }) =>
  Object.fromEntries(Object.entries({ line, column, endLine, endColumn }).filter(([, v]) => v !== undefined));
