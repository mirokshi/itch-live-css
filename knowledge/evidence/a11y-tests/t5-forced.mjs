import { openPage } from './cdp.mjs';
const [url, out] = process.argv.slice(2);
const ids = ['grad','url','shadow','transp','gradtext','gradtextsafe','optout','gen','card','tborder','link','backdrop'];
for (const fc of ['none', 'active']) {
  const p = await openPage(url, { width: 800, height: 900, media: [{ name: 'forced-colors', value: fc }] });
  console.log('== forced-colors:', fc, 'matches:', await p.eval(`matchMedia('(forced-colors: active)').matches`));
  for (const id of ids) {
    const r = await p.eval(`(()=>{const e=document.getElementById('${id}');const c=getComputedStyle(e);const b=getComputedStyle(e,'::before');
      return [c.color,c.backgroundColor,c.backgroundImage.slice(0,30),c.boxShadow,c.textShadow,c.webkitTextFillColor,c.borderTopColor,c.backdropFilter,c.forcedColorAdjust, b.content!=='none'?('before:'+b.color):''].join(' | ')})()`);
    console.log(id.padEnd(13), r);
  }
  if (out) await p.shot(`${out}-${fc}.png`);
  await p.close();
}
