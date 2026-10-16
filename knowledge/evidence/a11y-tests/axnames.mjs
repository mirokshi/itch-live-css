// node axnames.mjs <url> <selector,selector,...> [width]
import { openPage } from './cdp.mjs';
const [url, sels, w] = process.argv.slice(2);
const p = await openPage(url, { width: +(w || 1280) });
const doc = await p.send('DOM.getDocument', { depth: -1 });
await p.send('Accessibility.enable');
for (const sel of sels.split(',')) {
  const { nodeId } = await p.send('DOM.querySelector', { nodeId: doc.root.nodeId, selector: sel });
  if (!nodeId) { console.log(sel, 'NOT FOUND'); continue; }
  const ax = await p.send('Accessibility.getPartialAXTree', { nodeId, fetchRelatives: false });
  const n = ax.nodes[0];
  console.log(sel.padEnd(28), 'role=', n.role?.value, '| name=', JSON.stringify(n.name?.value), '| ignored=', n.ignored, (n.ignoredReasons||[]).map(r=>r.name).join(','));
}
await p.close();
