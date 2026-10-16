import { openPage } from './cdp.mjs';
const [url, out] = process.argv.slice(2);
for (const fc of ['none', 'active']) {
  const p = await openPage(url, { width: 700, height: 160, media: [{ name: 'forced-colors', value: fc }] });
  console.log(fc, JSON.stringify(await p.eval(`(()=>{const c=getComputedStyle(document.getElementById('sp'));const b=getComputedStyle(document.querySelector('#sp2 strong'));
    return {color:c.color,bg:c.backgroundColor,fill:c.webkitTextFillColor,innerVis:b.visibility}})()`)));
  await p.shot(`${out}-${fc}.png`);
  await p.close();
}
