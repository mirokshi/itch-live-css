import { openPage, axRows } from './cdp.mjs';
const url = process.argv[2];
const p = await openPage(url);
const rows = await axRows(p);
for (const r of rows) if (!r.ignored && ['heading','link','image','img','button','list','navigation','main','banner','contentinfo'].includes(r.role)) console.log(r.role.padEnd(10), JSON.stringify(r.name));
console.log('--- lang:', await p.eval('document.documentElement.lang'));
console.log('--- h1 count in DOM:', await p.eval('document.querySelectorAll("h1").length'), ' visible h1:', await p.eval('[...document.querySelectorAll("h1")].filter(h=>h.getClientRects().length).map(h=>h.className||h.textContent).join("|")'));
await p.close();
