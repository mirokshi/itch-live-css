import { openPage } from './cdp.mjs';
const url = process.argv[2];
const p = await openPage(url, { media: [{ name: 'prefers-reduced-transparency', value: 'reduce' }, { name: 'prefers-contrast', value: 'more' }] });
const tests = [
  `CSS.supports('selector(:focus-visible)')`, `CSS.supports('backdrop-filter','blur(1px)')`, `CSS.supports('-webkit-backdrop-filter','blur(1px)')`,
  `CSS.supports('overflow','clip')`, `CSS.supports('content','"a" / ""')`, `CSS.supports('forced-color-adjust','none')`,
  `matchMedia('(prefers-reduced-transparency: reduce)').matches`, `matchMedia('(prefers-contrast: more)').matches`, `CSS.supports('text-wrap','balance')`,
  `CSS.supports('selector(:has(a))')`, `CSS.supports('font-size','clamp(1rem, 2vw, 3rem)')`];
for (const t of tests) console.log(t.padEnd(64), await p.eval(t));
await p.close();
