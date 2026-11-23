// Validator: checks CSS against the knowledge base's rules (knowledge/itch-custom-css.md §0, R1–R24).
// Each problem carries its rule id, so the reason and the evidence are one lookup away.
// So far the cheap ones: R2–R4, R5 (hiding or relabelling itch's UI, and the External-link badge;
// covering and moving need the rendered page), R6 (url() beacons and [value] selectors; fake controls
// need a person), R7–R10 (R10's status and type: checkImports(), with a loader from the caller), R11
// (only its ad-block part, ROADMAP H8), R12, R14 (outline and animated
// properties), R15, R16, R17 (a reduced-motion guard for each moving element, the 5 s limit, nothing
// left hidden; whether the still page reads well needs the rendered page), R18, R19 (a general focus
// ring, no outline dropped on focus; its contrast needs the painted colours), R20 (only its jam part:
// no #wrapper h1, the title kept; one h1 per page needs the HTML), R21 (symbols in
// generated content without alt text; whether an opacity:0 hides something meaningful is intent),
// R22 (project pages), R23.
//
// The rules are a PostCSS plugin, itchRules(): one visitor per node type, with Once/OnceExit for the
// rules that need the whole sheet. validate() runs it over the tolerant parser, so problems still
// show while the CSS is half-typed (decisions/0001-postcss-validator.md).

import postcss from 'postcss';
import safeParser from 'postcss-safe-parser';
import { measure } from './output.js';
import MESSAGES from './messages.json' with { type: 'json' };
import { AD_BLOCKED, EMBED_ANCESTORS, ITCH_UI, KEPT_CLASSES, KEYFRAMES_PREFIX, STRIPPED_ATTRS } from './rules.js';

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
const UI = new RegExp(`(${ITCH_UI.map((s) => s.replace('.', '\\.')).join('|')})(?![\\w-])`);

// R5: declarations that hide an element (values lowercased)
const ZERO = /^0+(\.0*)?[a-z%]*$/;
const HIDES = new Map(Object.entries({
  display: /^none$/,
  visibility: /^(hidden|collapse)$/,
  opacity: /^(0+(\.0*)?|\.0+)%?$/,
  'font-size': ZERO,
  color: /^transparent$/,
  'clip-path': /^(inset\(\s*50%|circle\(\s*0)/,
  transform: /\bscale[xy]?\(\s*0(\.0*)?%?\s*[,)]/,
  scale: /^0(\.0*)?%?(\s|$)/,
  height: ZERO,
  'max-height': ZERO,
  width: ZERO,
  'max-width': ZERO,
}));
// a non-empty string: text that replaces or adds to a label
const LABEL = /"[^"]*\S[^"]*"|'[^']*\S[^']*'/;
// R17: transitioned properties that move things (all: whatever changes)
const MOVES = /^(all|transform|translate|rotate|scale|top|right|bottom|left|inset.*|margin.*|offset.*|perspective|background-position)$/;
const EASING = /^(ease(-in|-out|-in-out)?|linear|step-start|step-end|normal|allow-discrete)$/;
const TIME = /^[\d.]+m?s$/i;
const seconds = (t) => (/ms$/i.test(t) ? parseFloat(t) / 1000 : parseFloat(t));

// R22: what makes an element the containing block of the maximized game (BOXES), or traps its
// z-index under itch's tool bar (isolation)
const BOXES = ['filter', 'backdrop-filter', '-webkit-backdrop-filter', 'transform', 'rotate', 'scale', 'translate', 'perspective'];
const NOT_NONE = /^(?!(none|initial|unset|revert|revert-layer)$)/;
const TRAPS = new Map([
  ...BOXES.map((p) => [p, NOT_NONE]),
  ['will-change', /\b(transform|filter|perspective|rotate|scale|translate)\b/],
  ['contain', /\b(layout|paint|strict|content)\b/],
  ['content-visibility', /^auto$/],
  ['isolation', /^isolate$/],
]);
const ANCESTOR = new RegExp(`(${EMBED_ANCESTORS.map((s) => s.replace('.', '\\.')).join('|')})(?![\\w-])`);
// a selector that holds the game also names its ancestor
const HOLDS_GAME = /:has\([^()]*\.(game_frame|html_embed_widget|embed_wrapper)/;
// skips the effect on HTML5 pages, or while the game is maximized
const EMBED_GUARD = /:not\(\s*(:has\([^()]*\.(game_frame|html_embed_widget|embed_wrapper)|\.frame_maximized)/;
const MAXIMIZED = /\.(frame_)?maximized(?![\w-])/;

// R6: states a visitor causes, so a url() loaded only there reports them (:visited can't load anything)
const INTERACTION = /:(hover|active|focus(-visible|-within)?|checked|target|valid|invalid|placeholder-shown|autofill)(?![\w-])/i;

// Where a style rule sits: null if it isn't one (a keyframe, or inside @font-face, @scope…).
// nested: inside another style rule, so its selectors are relative. reduced, hover: inside
// @media (prefers-reduced-motion:reduce) or @media (hover:hover).
function context(node) {
  const ctx = { nested: false, reduced: false, calm: false, hover: false, starting: false };
  for (let p = node.parent; p && p.type !== 'root'; p = p.parent) {
    if (p.type === 'rule') ctx.nested = true;
    else if (p.type === 'atrule' && GROUPS.has(p.name.toLowerCase())) {
      ctx.reduced ||= /prefers-reduced-motion\s*:\s*reduce/i.test(p.params);
      ctx.calm ||= /prefers-reduced-motion\s*:\s*no-preference/i.test(p.params);
      ctx.hover ||= p.name.toLowerCase() === 'media' && /\(\s*(any-)?hover\s*(:\s*hover\s*)?\)/i.test(p.params);
      ctx.starting ||= p.name.toLowerCase() === 'starting-style';
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

// the selectors of the rules a nested rule sits in, outermost first
function ancestors(rule) {
  let s = '';
  for (let p = rule.parent; p; p = p.parent) if (p.type === 'rule') s = `${p.selector} ${s}`;
  return s;
}

// a selector without strings, attribute selectors and :not(…), which don't name what it targets
const plain = (sel) =>
  sel.replace(/"[^"]*"|'[^']*'/g, '').replace(/\[[^\]]*\]/g, '').replace(/:not\((?:[^()]|\([^()]*\))*\)/gi, '');

// the last compound of a selector: the element (or pseudo-element) it styles
function target(sel) {
  let depth = 0;
  let start = 0;
  for (let i = 0; i < sel.length; i++) {
    const c = sel[i];
    if (c === '(' || c === '[') depth++;
    else if (c === ')' || c === ']') depth--;
    else if (!depth && /[\s>+~]/.test(c)) start = i + 1;
  }
  return sel.slice(start);
}

// R5: the first declaration that hides or relabels; pseudo: the selector styles a ::before/::after
function hiding(decls, pseudo) {
  const clipped = decls.some((d) => /^(-webkit-)?background-clip$/i.test(d.prop) && /\btext\b/i.test(d.value));
  return decls.find((d) => {
    const prop = propOf(d);
    const value = d.value.trim().toLowerCase();
    if (prop === 'content') return pseudo ? LABEL.test(d.value) : !/^(none|normal)$/.test(value);
    // gradient text paints through a transparent colour
    return !pseudo && !!HIDES.get(prop)?.test(value) && !(prop === 'color' && clipped);
  });
}

// R5: on project pages itch's "External link" warning is the ::after of outbound links in descriptions
const badge = (t) => /::?after$/i.test(t) && /^(a(?![\w-])|\[rel)/i.test(t) && !/:not\(\s*\[rel/i.test(t);

// a nested selector written out in full, once per selector of each parent: "&" or a descendant of them
function resolved(rule, sel) {
  let out = [sel];
  for (let p = rule.parent; p; p = p.parent) {
    if (p.type !== 'rule') continue;
    const ups = p.selectors;
    out = out.flatMap((s) => ups.map((up) => (s.includes('&') ? s.replaceAll('&', up) : `${up} ${s}`)));
  }
  return out;
}

// a value's comma-separated layers, and a layer's words; commas and spaces inside functions stay
function layers(value) {
  const out = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < value.length; i++) {
    if (value[i] === '(') depth++;
    else if (value[i] === ')') depth--;
    else if (value[i] === ',' && !depth) {
      out.push(value.slice(start, i));
      start = i + 1;
    }
  }
  return [...out, value.slice(start)].map((s) => s.trim());
}
const words = (layer) => layer.match(/[\w.%-]+\((?:[^()]|\([^()]*\))*\)|\S+/g) ?? [];

// R17: selectors compared as text: spaces collapsed, :before/:after written ::before/::after
const norm = (sel) =>
  sel.replace(/\s+/g, ' ').replace(/\s*([>+~])\s*/g, '$1').replace(/(^|[^:]):(before|after)\b/gi, '$1::$2').trim();

// R17: B1's selector that reaches an element: #wrapper itself or #wrapper *, plus its ::before/::after
function reach(sel) {
  const pseudo = /::(before|after)\b/i.exec(sel)?.[0].toLowerCase() ?? '';
  const base = sel.replace(/::(before|after)\b.*$/i, '').replace(/\([^()]*\)/g, '()').replace(/\([^()]*\)/g, '()');
  return (/^(body\.frame_maximized\s+)?#wrapper[^\s>+~]*$/.test(base) ? '#wrapper' : '#wrapper *') + pseudo;
}

// R17: what moves in a rule: an animation, a transition of a property that moves things
function motion(decls) {
  const kinds = new Set();
  for (const d of decls) {
    const prop = propOf(d);
    const value = d.value.trim().toLowerCase();
    if (/^animation(-name)?$/.test(prop) && !/^(none|initial|unset|inherit|revert)\b/.test(value)) kinds.add('animation');
    if (/^transition(-property)?$/.test(prop)) {
      for (const layer of layers(value)) {
        const name = words(layer).find((w) => !TIME.test(w) && !w.includes('(') && !EASING.test(w)) ?? 'all';
        if (MOVES.test(name)) kinds.add('transition');
      }
    }
  }
  return kinds;
}

// R17: what a rule inside @media (prefers-reduced-motion:reduce) stops, and whether all of it is !important
function stops(decls) {
  const s = { animation: false, transition: false, important: true };
  for (const d of decls) {
    const prop = propOf(d);
    const value = d.value.trim().toLowerCase();
    const before = s.animation + s.transition;
    if (prop === 'display' && value === 'none') s.animation = s.transition = true;
    if (/^animation(-name)?$/.test(prop) && /^none\b/.test(value)) s.animation = true;
    if (/^transition(-property)?$/.test(prop) && /^none\b/.test(value)) s.transition = true;
    // the .01ms form also ends transitions at once
    if (prop === 'transition-duration' && layers(value).every((t) => TIME.test(t) && seconds(t) <= 0.01)) s.transition = true;
    if (s.animation + s.transition > before && !d.important) s.important = false;
  }
  return s;
}

// R17: if an animation runs past 5 s (infinite, or delay + duration × count), the last animation
// declaration of the rule. The shorthand sets every list and resets the longhands; a longhand after it
// replaces its own list; shorter lists repeat over animation-name's, as in browsers.
function endless(decls) {
  const runs = { name: [], duration: [0], delay: [0], count: [1] };
  const count = (t) => (t === 'infinite' ? Infinity : Number.isNaN(parseFloat(t)) ? 1 : parseFloat(t));
  let last;
  for (const d of decls) {
    const prop = propOf(d);
    const list = layers(d.value.toLowerCase());
    if (prop === 'animation') {
      const parsed = list.map((layer) => {
        const w = words(layer);
        const [duration = 0, delay = 0] = w.filter((t) => TIME.test(t)).map(seconds);
        const n = w.find((t) => t === 'infinite' || /^\d*\.?\d+$/.test(t));
        return { name: w.includes('none') ? 'none' : 'named', duration, delay, count: n ? count(n) : 1 };
      });
      for (const key of Object.keys(runs)) runs[key] = parsed.map((p) => p[key]);
    } else if (prop === 'animation-name') runs.name = list;
    else if (prop === 'animation-duration' || prop === 'animation-delay') runs[prop.slice(10)] = list.map((t) => (TIME.test(t) ? seconds(t) : 0));
    else if (prop === 'animation-iteration-count') runs.count = list.map(count);
    else continue;
    last = d;
  }
  const at = (list, i) => list[i % list.length];
  // a zero duration never moves, even infinitely (0 × Infinity is NaN)
  return runs.name.some((name, i) => name !== 'none' && at(runs.delay, i) + at(runs.duration, i) * at(runs.count, i) > 5) ? last : undefined;
}

// R17: the animation that alone shows an element whose base is opacity:0 or visibility:hidden
function revealed(decls, frames) {
  const hidden = decls.some((d) => {
    const value = d.value.trim().toLowerCase();
    return (propOf(d) === 'opacity' && HIDES.get('opacity').test(value)) || (propOf(d) === 'visibility' && value === 'hidden');
  });
  if (!hidden) return;
  const shows = (w) => frames.get(w)?.has('opacity') || frames.get(w)?.has('visibility');
  return decls.find((d) => /^animation(-name)?$/.test(propOf(d)) && layers(d.value).some((l) => words(l).some(shows)));
}

// R19: a focus state on the element a selector styles; general: on any element of a type, not one class or id
const FOCUS = /:focus(-visible)?(?![\w-])/;
const general = (t) => /^(\*|[a-z][\w-]*)?$/i.test(t.replace(FOCUS, ''));
// R19: an outline that draws (shorthand, style or width), or one taken away
const OUTLINE = /^outline(-style|-width)?$/;
const NO_OUTLINE = /^(none|0+([a-z]+)?|hidden)$/;

// R21: a content value's text as the accessibility tree gets it (escapes decoded), whether it is only
// strings, and whether it carries alt text ("★" / "")
const STRINGS = /"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'/g;
function generated(value) {
  const text = [...value.matchAll(STRINGS)]
    .map((m) => m[1] ?? m[2])
    .join('')
    .replace(/\\([0-9a-f]{1,6})\s?|\\(.)/gi, (_, hex, c) => (hex ? String.fromCodePoint(Math.min(parseInt(hex, 16), 0x10ffff)) : c));
  const rest = value.replace(STRINGS, '');
  return { text, onlyStrings: !/[^\s/]/.test(rest.replace(/\/.*$/s, '')), alt: rest.includes('/') };
}
// symbols only: no letters or digits, and more than ASCII punctuation (which screen readers mostly skip)
const decorative = (text) => /[^\s!-/:-@[-`{-~]/.test(text) && !/[\p{L}\p{N}]/u.test(text);

// R22: the first animation that keeps a containing-block property after it ends (fill both/forwards);
// frames: @keyframes name → the properties it animates
function filled(decls, frames) {
  const fillMode = decls.findLast((d) => propOf(d) === 'animation-fill-mode')?.value ?? '';
  for (const d of decls) {
    const prop = propOf(d);
    if (prop !== 'animation' && prop !== 'animation-name') continue;
    for (const layer of d.value.split(',')) {
      const words = layer.trim().split(/\s+/);
      const name = words.find((w) => frames.has(w));
      const kept = (prop === 'animation' && words.some((w) => /^(both|forwards)$/i.test(w))) || /\b(both|forwards)\b/i.test(fillMode);
      if (name && kept && BOXES.some((p) => frames.get(name).has(p))) return { node: d, name };
    }
  }
}

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
      const beacons = new Map();
      const loaded = new Set();
      const frames = new Map();
      let styled = false; // R19: the sheet has a style rule
      let ring = false; // R19: … and a general focus ring
      const moving = []; // R17: { sel, kind, node } of everything that moves
      const guards = []; // R17: { sel, animation, transition, important } inside prefers-reduced-motion:reduce
      const traps = new Map(); // "ancestor|property" → the problem to report
      const released = new Set(); // the same keys, set back to none/auto while the game is maximized
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
            const name = at.params.trim().split(/\s/)[0].replace(/^["']|["']$/g, '');
            const props = frames.get(name) ?? new Set();
            at.walkDecls((d) => {
              animated.add(propOf(d));
              props.add(propOf(d));
            });
            frames.set(name, props);
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

          // R5 and R6 read each selector with its ancestors'
          const outer = ancestors(rule);
          let hidden = ctx.starting; // @starting-style is where a transition starts, not where it ends
          for (const sel of rule.selectors) {
            const full = plain(`${outer} ${sel}`);
            const ui = !hidden && UI.exec(full)?.[1];
            const bad = ui && hiding(decls, /::|:(before|after|first-line|first-letter)\b/i.test(target(sel)));
            if (bad) {
              hidden = true;
              add('R5', 'warning', 'R5.hide', { decl: short(`${bad.prop}:${bad.value}`), ui }, bad);
            }
            if (page === 'project' && badge(target(sel))) add('R5', 'warning', 'R5.badge', { sel: short(sel) }, rule, { word: sel });
            if (/\[\s*value\b/i.test(`${outer} ${sel}`.replace(/"[^"]*"|'[^']*'/g, ''))) {
              add('R6', 'warning', 'R6.field', { sel: short(sel) }, rule, { word: sel });
            }
          }
          // R6: a url() that loads only on interaction tells its server; reported in OnceExit unless the
          // same URL also loads without one (then it's already cached)
          const interactive = rule.selectors.every((s) => INTERACTION.test(plain(`${outer} ${s}`))) && rule.selectors[0];
          for (const d of decls) {
            for (const url of urls(d.value)) {
              if (/^data:/i.test(url)) continue;
              if (interactive) first(beacons, url, { node: d, sel: interactive });
              else loaded.add(url);
            }
          }

          // R17: motion needs a reduced-motion guard (matched in OnceExit), ends within 5 s when it starts
          // by itself, and never keeps hidden what only it reveals
          // [selector as written, written out in full] for every parent selector it nests in
          const spelled = rule.selectors.flatMap((sel) => resolved(rule, sel).map((full) => [sel, full]));
          if (!ctx.starting) {
            const sels = spelled.map(([, full]) => norm(full));
            if (ctx.reduced) {
              const s = stops(decls);
              if (s.animation || s.transition) for (const sel of sels) guards.push({ sel, ...s });
            } else {
              // inside @media (prefers-reduced-motion:no-preference) it never runs for those who asked
              if (!ctx.calm) for (const kind of motion(decls)) for (const sel of sels) moving.push({ sel, kind, node: rule });
              const auto = !sels.every((s) => INTERACTION.test(plain(s)));
              const timed = !decls.some((d) => propOf(d) === 'animation-timeline' && !/^auto$/i.test(d.value.trim()));
              const long = auto && timed && endless(decls);
              if (long) add('R17', 'warning', 'R17.long', { decl: short(`${long.prop}:${long.value}`), sel: short(rule.selectors[0]) }, long);
              // a ::before/::after without text is decoration, which may stay hidden
              const text = !sels.some((s) => /::(before|after)\b/i.test(target(s))) || decls.some((d) => propOf(d) === 'content' && LABEL.test(d.value));
              const shown = !ctx.calm && text && revealed(decls, frames);
              if (shown) add('R17', 'warning', 'R17.hidden', { sel: short(rule.selectors[0]) }, shown);
            }
          }

          // R19: a general focus ring somewhere in the sheet (reported in OnceExit), and no focus rule that
          // drops the outline without a box-shadow or border in its place (outline:none!important is R14's)
          styled ||= decls.length > 0;
          for (const [sel, full] of spelled) {
            const t = plain(target(full));
            if (!FOCUS.test(t) || /::/.test(t)) continue;
            const outlines = decls.filter((d) => OUTLINE.test(propOf(d)));
            const drawn = outlines.some((d) => !NO_OUTLINE.test(d.value.trim().toLowerCase()));
            if (drawn && general(t)) ring = true;
            const dropped = outlines.find((d) => !d.important && NO_OUTLINE.test(d.value.trim().toLowerCase()));
            const instead = decls.some((d) => /^(box-shadow|border(-\w+)*)$/.test(propOf(d)) && !NO_OUTLINE.test(d.value.trim().toLowerCase()));
            if (dropped && !drawn && !instead) {
              add('R19', 'warning', 'R19.none', { sel: short(sel) }, dropped);
              break;
            }
          }

          // R20: on jams itch's h1.jam_title_header names the page; style it, or description h1s under
          // .jam_content, never every h1, and never hide the title
          if (page === 'jam') {
            for (const [sel, full] of spelled) {
              const t = plain(target(full));
              if (/^h1(?![\w-])/i.test(t) && !/[.#]/.test(t) && !/\.(jam_content|jam_header_widget)(?![\w-])/.test(full)) {
                add('R20', 'warning', 'R20.jam', { sel: short(sel) }, rule, { word: sel });
                break;
              }
              const bad = /\.jam_title_header(?![\w-])/.test(plain(full)) && !/::|:(before|after)\b/i.test(t) && hiding(decls, false);
              if (bad) {
                add('R20', 'warning', 'R20.title', { decl: short(`${bad.prop}:${bad.value}`) }, bad);
                break;
              }
            }
          }

          // R21: decorative generated text is read aloud unless some content declaration gives it alt text
          if (rule.selectors.some((s) => /::?(before|after)\b/i.test(target(s)))) {
            const contents = decls.filter((d) => propOf(d) === 'content').map((d) => ({ d, ...generated(d.value) }));
            const loud = !contents.some((c) => c.alt) && contents.find((c) => c.onlyStrings && decorative(c.text));
            if (loud) add('R21', 'warning', 'R21.alt', { value: short(loud.d.value), sel: short(rule.selectors[0]) }, loud.d);
          }

          // R22: on project pages, effects on the HTML5 game's ancestors trap it when itch maximizes it;
          // reported in OnceExit unless a maximized-only rule sets them back
          if (page === 'project' && !ctx.starting) {
            for (const [sel, full] of spelled) {
              const t = target(full);
              if (/::|:(before|after|first-line|first-letter)\b/i.test(t) || EMBED_GUARD.test(full)) continue;
              const who = ANCESTOR.exec(plain(t))?.[1] ?? (HOLDS_GAME.test(t) ? plain(t) : null);
              if (!who) continue;
              const maximized = MAXIMIZED.test(full);
              for (const d of decls) {
                const prop = propOf(d);
                if (!TRAPS.has(prop)) continue;
                const key = `${who}|${prop}`;
                if (TRAPS.get(prop).test(d.value.trim().toLowerCase())) {
                  const code = prop === 'isolation' ? 'R22.isolation' : 'R22.trap';
                  first(traps, key, { node: d, code, params: { decl: short(`${d.prop}:${d.value}`), sel: short(sel) } });
                } else if (maximized) released.add(key);
              }
              const kept = filled(decls, frames);
              if (kept) first(traps, `${who}|animation`, { node: kept.node, code: 'R22.fill', params: { name: kept.name, sel: short(sel) } });
              else if (maximized && decls.some((d) => /^animation(-name)?$/.test(propOf(d)) && /^none\b/i.test(d.value))) released.add(`${who}|animation`);
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
          // R19: itch's ring is #361275, 1.14–1.5:1 on dark backgrounds
          if (styled && !ring) add('R19', 'warning', 'R19.ring');
          // R17: each moving element needs a guard of its own, or the B1 selector that reaches it with !important
          const unguarded = new Map();
          for (const { sel, kind, node } of moving) {
            const need = reach(sel);
            // a guard on the element also stops its :hover/:focus states, if it's !important
            const still = sel.replace(/:(hover|active|focus(-visible|-within)?)(?![\w-])/gi, '');
            const covered = guards.some((g) => g[kind] && (g.sel === sel || (g.important && (g.sel === need || g.sel === still))));
            if (!covered) first(unguarded, need, { node, sel });
          }
          for (const [need, { node, sel }] of unguarded) add('R17', 'warning', 'R17.guard', { sel: short(sel), need }, node);
          for (const [key, { node, code, params }] of traps) {
            if (!released.has(key)) add('R22', 'warning', code, params, node);
          }
          for (const [url, { node, sel }] of beacons) {
            if (!loaded.has(url)) add('R6', 'warning', 'R6.beacon', { url: short(url), sel: short(sel) }, node, { word: url });
          }
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

// R10 over the network: what each @import's response means. The engine makes no requests: the caller
// passes load(url) → { status, type } (after redirects) or { error: 'timeout' | 'failed' | 'blocked', reason? }
// ('blocked': the caller's own limits, not the user's mistake). Checks the top-level https imports,
// each URL once, at most `max`; raw GitHub URLs are R10.raw already.
export async function checkImports(css, load, { max = 4, seconds = 3 } = {}) {
  const root = safeParser(asServed(css));
  const found = new Map(); // url → its first @import
  for (const node of root.nodes) {
    if (node.type !== 'atrule' || node.name.toLowerCase() !== 'import' || node.nodes) continue;
    const url = importUrl(node.params) ?? '';
    if (/^https:\/\//i.test(url) && !/^https:\/\/(raw|gist)\.githubusercontent\.com\//i.test(url) && !found.has(url)) found.set(url, node);
  }
  const checks = [...found].slice(0, max);
  const answers = await Promise.all(checks.map(([url]) => load(url)));
  const problems = [];
  checks.forEach(([url, node], i) => {
    const res = answers[i];
    const what = short(statement(node));
    let level = 'error';
    let code;
    let params = { what };
    if (res.error === 'timeout') [level, code, params] = ['warning', 'R10.slow', { what, seconds }];
    else if (res.error === 'failed') [code, params] = ['R10.failed', { what, reason: res.reason ?? 'no connection' }];
    else if (res.error) return;
    else if (!(res.status >= 200 && res.status < 300)) {
      // Google Fonts answers 400 for a misspelled family or an axis past the font's range (knowledge base §8)
      [code, params] = res.status === 400 && /^https:\/\/fonts\.googleapis\.com\//i.test(url) ? ['R10.fonts', { what }] : ['R10.status', { what, status: res.status }];
    } else if (!/^text\/css\b/i.test(res.type ?? '')) [code, params] = ['R10.type', { what, type: (res.type || 'no type').split(';')[0] }];
    else return;
    const { start, end } = node.rangeBy({});
    problems.push({ rule: 'R10', level, code, params, message: text(code, params), line: start.line, column: start.column, endLine: end.line, endColumn: end.column });
  });
  return problems;
}

// R11 in the page HTML (bio, description, post): the classes and attributes itch's sanitizer drops, so
// CSS written for them never matches. A tag-and-attribute scan, enough for a warning.
export function checkMarkup(html) {
  const lost = new Set();
  const stripped = new Set();
  const tags = html.replace(/<!--[\s\S]*?-->/g, '').matchAll(/<([a-z][\w-]*)((?:"[^"]*"|'[^']*'|[^'">])*)>/gi);
  for (const [, tag, attrs] of tags) {
    const pairs = [...attrs.matchAll(/([^\s"'>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g)]
      .map((m) => [m[1].toLowerCase(), m[2] ?? m[3] ?? m[4] ?? '']);
    const classes = pairs.find(([name]) => name === 'class')?.[1].split(/\s+/).filter(Boolean) ?? [];
    const code = tag.toLowerCase() === 'code';
    for (const c of classes) if (!c.startsWith('custom') && !KEPT_CLASSES.includes(c) && !(code && c.startsWith('language-'))) lost.add(c);
    for (const [name] of pairs) if (STRIPPED_ATTRS.test(name) && !(name === 'tabindex' && classes.includes('spoiler'))) stripped.add(name);
  }
  const list = (set) => [...set].slice(0, 6).join(', ') + (set.size > 6 ? '…' : '');
  const problems = [];
  for (const [set, code] of [[lost, 'R11.class'], [stripped, 'R11.attr']]) {
    if (set.size) problems.push({ rule: 'R11', level: 'warning', code, params: { names: list(set) }, message: text(code, { names: list(set) }) });
  }
  return problems;
}

// R20 on profiles, projects and devlog posts: the h1s the page shows, itch's plus the user's HTML's,
// should be exactly one. itch's own (knowledge base §10): the profile's .text_header h1 unless there's
// a banner, a project's h1.game_title unless there's a banner or an HTML5 game, a devlog post's title
// always. CSS that styles that h1, or the box holding it, with display:none or visibility:hidden takes
// it away (opacity:0 and font-size:0 leave it in the accessibility tree). html: the bio, description or
// post as the user has it; html5: the project's game runs in the browser.
const ITCH_H1 = {
  profile: /(\.text_header|#profile_header)(?![\w-])/,
  project: /(#header|\.game_title)(?![\w-])/,
  devlog: /\.post_header(?![\w-])/,
};
export function checkHeadings({ html = '', css = '', page, banner = false, html5 = false }) {
  const box = ITCH_H1[page];
  if (!box) return [];
  let itch = page === 'devlog' || !(banner || (page === 'project' && html5)) ? 1 : 0;
  safeParser(asServed(css)).walkRules((rule) => {
    const gone = declarations(rule).some((d) => {
      const value = d.value.trim().toLowerCase();
      return (propOf(d) === 'display' && value === 'none') || (propOf(d) === 'visibility' && /^(hidden|collapse)$/.test(value));
    });
    const takes = (full) => {
      const t = plain(target(full));
      return box.test(plain(full)) && !/::|:(before|after)\b/i.test(t) && (box.test(t) || /^h1(?![\w-])/i.test(t));
    };
    if (gone && context(rule) && rule.selectors.some((s) => resolved(rule, s).some(takes))) itch = 0;
  });
  const mine = (html.replace(/<!--[\s\S]*?-->/g, '').match(/<h1[\s>/]/gi) ?? []).length;
  const count = itch + mine;
  if (count === 1) return [];
  const [code, params] = count ? ['R20.many', { count, itch, mine }] : ['R20.none', {}];
  return [{ rule: 'R20', level: 'warning', code, params, message: text(code, params) }];
}

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
