// usage: node r2-ax.mjs file:///.../r2-ax.html dn,vh,op,...   (ids to inspect)
// Accessible name + ignored state for each id on a page; also translate offsets of #tf/#ib spans.
import { openPage } from './cdp.mjs';
const [url, ids] = process.argv.slice(2);
const p = await openPage(url);
const doc = await p.send('DOM.getDocument', { depth: -1 }); await p.send('Accessibility.enable');
for (const id of ids.split(',')) {
  const { nodeId } = await p.send('DOM.querySelector', { nodeId: doc.root.nodeId, selector: '#' + id });
  if (!nodeId) { console.log(id, 'NOT FOUND'); continue; }
  const n = (await p.send('Accessibility.getPartialAXTree', { nodeId, fetchRelatives: false })).nodes[0];
  console.log(id.padEnd(6), 'role=' + (n.role?.value || ''), '| name=' + JSON.stringify(n.name?.value ?? null), '| ignored=' + n.ignored, (n.ignoredReasons || []).map(r => r.name).join(','));
}
if (await p.eval(`!!document.querySelector('#tf')`)) console.log(await p.eval(`(()=>{const d=s=>{const e=document.querySelector(s);return Math.round(e.firstElementChild.getBoundingClientRect().top-e.getBoundingClientRect().top)};return 'span offset: plain='+d('#plain')+' translate-inline='+d('#tf')+' rel='+d('#rl')})()`));
await p.close();
