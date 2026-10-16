import { openPage, axRows } from './cdp.mjs';
const url = process.argv[2]; // file:///.../t1-axtree.html
const p = await openPage(url);
console.log('UA', await p.eval('navigator.userAgent'));
console.log('supports content alt:', await p.eval(`CSS.supports('content','"x" / ""')`));
const rows = await axRows(p);
for (const r of rows) {
  if (['heading', 'link', 'StaticText'].includes(r.role) || r.ignored) {
    if (r.role === 'StaticText' && !r.ignored) continue;
    console.log(JSON.stringify(r));
  }
}
// which ids appear as nodes at all
const ids = ['h-dn','h-vis','h-op','h-tr','h-clip','h-zero','h-indent','h-gen','h-alt-empty','h-alt-text','a-arrow','h-letters','h-letters-rot','h-letters-block','h-replace'];
const doc = await p.send('DOM.getDocument', { depth: -1 });
for (const id of ids) {
  const { nodeId } = await p.send('DOM.querySelector', { nodeId: doc.root.nodeId, selector: '#' + id });
  try {
    const ax = await p.send('Accessibility.getPartialAXTree', { nodeId, fetchRelatives: false });
    const n = ax.nodes[0];
    console.log(id.padEnd(16), 'role=', n.role?.value, '| name=', JSON.stringify(n.name?.value), '| ignored=', n.ignored, (n.ignoredReasons||[]).map(r=>r.name).join(','));
  } catch (e) { console.log(id, 'ERR', e.message.slice(0, 120)); }
}
await p.close();
