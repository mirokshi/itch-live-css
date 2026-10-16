// Full-viewport screenshots of the profile with forced-colors none/active, to see if the url() panel image is painted.
import { openPage } from './cdp.mjs';
const [url, out] = process.argv.slice(2);
for (const fc of ['none','active']) {
  const p = await openPage(url, { width: 1280, height: 900, media: [{ name: 'forced-colors', value: fc }, { name: 'prefers-reduced-motion', value: 'reduce' }] });
  await p.eval(`(()=>{const s=document.createElement('style');s.textContent='#wrapper::before,#wrapper::after,#wrapper .user_page::before{display:none!important}';document.head.append(s)})()`);
  console.log(fc, await p.eval(`getComputedStyle(document.querySelector('#wrapper')).backgroundImage.slice(0,20)+' size='+getComputedStyle(document.querySelector('#wrapper')).backgroundSize+' bodyBg='+getComputedStyle(document.body).backgroundColor+' wrapBg='+getComputedStyle(document.querySelector('#wrapper')).backgroundColor`));
  await p.shot(`${out}-${fc}.png`);
  await p.close();
}
