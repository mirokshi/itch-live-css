// Minimal PNG decoder (8-bit, non-interlaced, RGB/RGBA) -> mean/min/max color and distinct-color count in a region.
import fs from 'node:fs'; import zlib from 'node:zlib';
const [file, x0=0, y0=0, w0, h0] = process.argv.slice(2);
const b = fs.readFileSync(file); let p = 8, W, H, ct, idat = [];
while (p < b.length) { const len = b.readUInt32BE(p), type = b.toString('ascii', p+4, p+8), d = b.subarray(p+8, p+8+len);
  if (type==='IHDR') { W=d.readUInt32BE(0); H=d.readUInt32BE(4); ct=d[9]; } else if (type==='IDAT') idat.push(d); p += 12+len; }
const bpp = ct===6?4:3, raw = zlib.inflateSync(Buffer.concat(idat)), stride = W*bpp, px = Buffer.alloc(H*stride);
for (let y=0;y<H;y++){ const f=raw[y*(stride+1)], s=raw.subarray(y*(stride+1)+1,(y+1)*(stride+1));
  for (let i=0;i<stride;i++){ const a=i>=bpp?px[y*stride+i-bpp]:0, up=y?px[(y-1)*stride+i]:0, c=(y&&i>=bpp)?px[(y-1)*stride+i-bpp]:0; let v=s[i];
    if(f===1)v+=a; else if(f===2)v+=up; else if(f===3)v+=(a+up)>>1; else if(f===4){const pp=a+up-c,pa=Math.abs(pp-a),pb=Math.abs(pp-up),pc=Math.abs(pp-c);v+=(pa<=pb&&pa<=pc)?a:(pb<=pc?up:c);} px[y*stride+i]=v&255; } }
const X=+x0,Y=+y0,RW=+(w0||W-X),RH=+(h0||H-Y); let sum=[0,0,0],n=0,set=new Set(),mx=[0,0,0];
for(let y=Y;y<Y+RH;y++)for(let x=X;x<X+RW;x++){const o=y*stride+x*bpp;const c=[px[o],px[o+1],px[o+2]];c.forEach((v,i)=>{sum[i]+=v;mx[i]=Math.max(mx[i],v)});n++;set.add(c.join(','));}
console.log(file.split(/[\/]/).pop(), `${W}x${H}`, 'region', X,Y,RW,RH, 'mean', sum.map(v=>Math.round(v/n)).join(','), 'max', mx.join(','), 'distinct', set.size);
