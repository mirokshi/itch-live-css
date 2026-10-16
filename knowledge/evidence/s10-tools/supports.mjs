// CSS.supports probes in the running Chrome. usage: CDP_PORT=N node supports.mjs <any file URL>
import { openPage } from '../a11y-tests/cdp.mjs';
const p = await openPage(process.argv[2]);
const expr = "[navigator.userAgent.split('Chrome/')[1].split(' ')[0], '-webkit-backdrop-filter:' + CSS.supports('-webkit-backdrop-filter', 'blur(1px)'), 'backdrop-filter:' + CSS.supports('backdrop-filter', 'blur(1px)'), 'content-alt:' + CSS.supports('content', '\"a\" / \"\"'), 'has:' + CSS.supports('selector(:has(a))')].join(' ')";
console.log(await p.eval(expr));
await p.close();
