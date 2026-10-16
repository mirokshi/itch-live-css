import { openPage } from './cdp.mjs';
import fs from 'node:fs';
const p = await openPage('about:blank');
const b64 = fs.readFileSync(process.argv[2]).toString('base64');
await p.eval(`(()=>{const i=document.createElement('img');i.id='i';i.src='data:image/jpeg;base64,${b64}';document.body.append(i)})()`);
console.log(await p.eval(`(async()=>{const i=document.getElementById('i');await i.decode();const W=i.naturalWidth,H=i.naturalHeight;
 const c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');x.drawImage(i,0,0);const d=x.getImageData(0,0,W,H).data;
 const hex=a=>'#'+a.map(v=>Math.round(v).toString(16).padStart(2,'0')).join('');
 const mean=(x0,y0,w,h)=>{let s=[0,0,0],n=0;for(let y=y0;y<y0+h;y++)for(let X=x0;X<x0+w;X++){const o=(y*W+X)*4;s[0]+=d[o];s[1]+=d[o+1];s[2]+=d[o+2];n++}return s.map(v=>v/n)};
 const B=64;let best=null,bl=-1;for(let y=0;y+B<=H;y+=B)for(let X=0;X+B<=W;X+=B){const m=mean(X,y,B,B);const l=.2126*m[0]+.7152*m[1]+.0722*m[2];if(l>bl){bl=l;best=[X,y,m]}}
 let mx=[0,0,0];for(let o=0;o<d.length;o+=4){const l=.2126*d[o]+.7152*d[o+1]+.0722*d[o+2];if(l>.2126*mx[0]+.7152*mx[1]+.0722*mx[2])mx=[d[o],d[o+1],d[o+2]]}
 return {size:W+'x'+H, overall:hex(mean(0,0,W,H)), cornerTL:hex(mean(0,0,64,64)), cornerBR:hex(mean(W-64,H-64,64,64)), brightest64block:hex(best[2])+' at '+best[0]+','+best[1], brightestPixel:hex(mx)};})()`));
await p.close();
