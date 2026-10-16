import { openPage } from './cdp.mjs';
const url = process.argv[2];
for (const rm of ['no-preference','reduce']) {
  const p = await openPage(url, { media: [{ name: 'prefers-reduced-motion', value: rm }] });
  const doc = await p.send('DOM.getDocument', { depth: -1 }); await p.send('Accessibility.enable');
  if (rm === 'no-preference') for (const sel of ['#tl','#tlalt','#noalt','#inl','#ib','#anim']) {
    const { nodeId } = await p.send('DOM.querySelector', { nodeId: doc.root.nodeId, selector: sel });
    const n = (await p.send('Accessibility.getPartialAXTree', { nodeId, fetchRelatives: false })).nodes[0];
    console.log(sel.padEnd(8), JSON.stringify(n.name?.value));
  }
  console.log(rm, JSON.stringify(await p.eval(`(()=>{const w=document.querySelector('#wrapper');
    const top=s=>Math.round(document.querySelector(s).getBoundingClientRect().top);
    return {wrapperBefore:getComputedStyle(w,'::before').animationName, wrapperAfter:getComputedStyle(w,'::after').animationName,
      spanAnim:getComputedStyle(document.querySelector('#anim span')).animationName,
      inlineTranslateMoves: top('#inl span')-top('#inl'), inlineBlockTranslateMoves: top('#ib span')-top('#ib'),
      running:document.getAnimations().length}})()`)));
  await p.close();
}
