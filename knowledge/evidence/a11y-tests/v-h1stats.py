# Independent recount: title-h1 hiding and banner alt over sampled project pages.
import re,sys,glob,os
sys.stdout.reconfigure(encoding='utf-8')
d=sys.argv[1]; n=0; c={}
def inc(k): c[k]=c.get(k,0)+1
for f in sorted(glob.glob(os.path.join(d,'p*.html'))):
    s=open(f,encoding='utf8',errors='replace').read()
    if 'id="wrapper"' not in s: inc('no wrapper (skipped)'); continue
    n+=1
    body=re.search(r'<body[^>]*>',s).group(0)
    emb=bool(re.search(r'class="[^"]*\bembedded_game\b',body)) and 'embed_disabled' not in body
    hdr=re.search(r'<div class="header([^"]*)"[^>]*>(.*?)</div>',s,re.S)
    has_img=bool(hdr and 'has_image' in hdr.group(1))
    hidden=has_img or emb
    if has_img: inc('has_image')
    if emb: inc('embedded (not disabled)')
    if has_img and emb: inc('both')
    if hidden: inc('title h1 hidden')
    h1=re.findall(r'<h1\b[^>]*>',s)
    others=[h for h in h1 if 'game_title' not in h]
    if hidden and not others: inc('hidden AND no other h1')
    if has_img:
        img=re.search(r'<img([^>]*)>',hdr.group(2))
        if img and re.search(r'\balt="[^"]+"',img.group(1)): inc('banner img with non-empty alt')
        elif img: inc('banner img WITHOUT alt'); print('noalt',f)
    if emb and not has_img: inc('embed without banner (no img carries title)')
    if 'embed_disabled' in body: inc('embed_disabled in body')
    if 'id="custom_css"' in s: inc('custom_css')
print('pages',n); [print(f'{v:3d} {k}') for k,v in sorted(c.items())]
