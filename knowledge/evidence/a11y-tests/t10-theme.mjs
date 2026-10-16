import { openPage } from './cdp.mjs';
const p = await openPage(process.argv[2]);
console.log(await p.eval(`(()=>{const g=s=>{const e=document.querySelector(s);return e?getComputedStyle(e).color:'-'};
 return {genre:g('#wrapper .game_genre'), text:g('#wrapper .game_text'), titleLink:g('#wrapper .game_title a'), footerLink:g('#wrapper .footer a'), bio:g('#wrapper .user_profile'),
  headings:[...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(h=>h.tagName+(h.getClientRects().length?'':'(hidden)')).join(' '),
  footerLinkBox:(()=>{const r=document.querySelector('#wrapper .footer a').getBoundingClientRect();return Math.round(r.width)+'x'+Math.round(r.height)})()}})()`));
await p.close();
