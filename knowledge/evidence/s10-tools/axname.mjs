// Print Chrome's computed accessible name (CDP Accessibility.getPartialAXTree) for each selector. usage: node axname.mjs <url> <sel>...
import { openPage } from '../a11y-tests/cdp.mjs';
const [url, ...sels] = process.argv.slice(2);
const p = await openPage(url, { width: 900, height: 600 });
await p.send('Accessibility.enable');
const { root } = await p.send('DOM.getDocument', { depth: -1 });
for (const sel of sels) {
  const { nodeId } = await p.send('DOM.querySelector', { nodeId: root.nodeId, selector: sel });
  const { nodes } = await p.send('Accessibility.getPartialAXTree', { nodeId, fetchRelatives: false });
  const n = nodes[0];
  console.log(sel.padEnd(12), 'role=' + n.role?.value, 'ignored=' + n.ignored, 'name=' + JSON.stringify(n.name?.value));
}
await p.close();
