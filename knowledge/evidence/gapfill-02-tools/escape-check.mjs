// gapfill-02 (2026-10-14): does a cssString-style \hex escaper keep a request-derived value inside one CSS
// string? Compares raw interpolation with escaped interpolation in Chrome's CSS parser.
// usage: CDP_PORT=9482 node escape-check.mjs
import { openPage } from '../a11y-tests/cdp.mjs';

// Same algorithm as the private repo's custom-css/lib/util.js cssString (re-implemented here).
function cssString(s) {
  return '"' + [...s].map((c) => {
    const code = c.codePointAt(0);
    if (code > 126 || code < 32) return `\\${code.toString(16)} `;
    return c === '"' || c === '\\' ? `\\${c}` : c;
  }).join('') + '"';
}
// Header-like inputs: a normal value, one that tries to close the string and add a rule, one with a newline.
const inputs = ['es-ES,es;q=0.9', 'x"}#wrapper{display:none}#a{b:"', 'x\n}#wrapper{display:none}', 'a\\"}#wrapper{display:none}/*'];
const p = await openPage('about:blank');
for (const v of inputs) {
  for (const mode of ['raw', 'escaped']) {
    const lit = mode === 'raw' ? `"${v}"` : cssString(v);
    const css = `#wrapper::before{content:${lit}}`;
    const r = await p.eval(`(()=>{const s=new CSSStyleSheet();s.replaceSync(${JSON.stringify(css)});
      return {rules:s.cssRules.length,first:s.cssRules[0]?.cssText.slice(0,70),hidesWrapper:[...s.cssRules].some(x=>/display:\\s*none/.test(x.cssText))}})()`);
    console.log(mode.padEnd(8), JSON.stringify(v).padEnd(40), JSON.stringify(r));
  }
}
await p.close();
