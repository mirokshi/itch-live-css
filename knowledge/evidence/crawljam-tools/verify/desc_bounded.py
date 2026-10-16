# usage: python -I desc_bounded.py raw/ov_*.html  -> markup stats of .jam_content.user_formatted, cut at #entries / lightbox template (fixes the early stop of ../desc.py)
import re,sys,collections
sys.stdout.reconfigure(encoding='utf-8')
C=collections.Counter
tags=C();cls=C();ids=0;sty=C();ifr=C();rel=C();tgt=0;links=0;imgs=0;lazy=0;nst=0;per=C()
for f in sys.argv[1:]:
    h=open(f,encoding='utf8').read()
    i=h.find('<div class="jam_content user_formatted">')
    if i<0: continue
    # attribute order varies between requests (2nd verifier, 2026-10-14): match the ids loosely
    ends=[m.start() for m in (re.compile(r'<div[^>]*\sid="entries"').search(h,i),re.compile(r'<script[^>]*\sid="add_game_to_jam_lightbox_tpl"').search(h,i)) if m]
    d=h[i+len('<div class="jam_content user_formatted">'):min(ends)]
    for m in re.finditer(r'<([a-zA-Z][a-zA-Z0-9]*)((?:\s[^>]*)?)>',d):
        t=m.group(1).lower(); a=m.group(2); tags[t]+=1
        cm=re.search(r'\sclass="([^"]*)"',a)
        if cm:
            for c in cm.group(1).split(): cls['custom-*' if c.startswith('custom-') else c]+=1; per[(f.split('/')[-1][3:20], c)]+= (not c.startswith('custom-') and c!='text-center')
        if re.search(r'\sid="',a): ids+=1
        sm=re.search(r'\sstyle="([^"]*)"',a)
        if sm: nst+=1; sty[re.sub(r'#[0-9a-fA-F]+','#HEX',sm.group(1))[:40]]+=1
        if t=='iframe':
            s=re.search(r'\ssrc="([^"]*)"',a); s=s.group(1) if s else ''
            hm=re.match(r'(?:https?:)?//([^/]+)',s); ifr[hm.group(1) if hm else s[:20]]+=1
        if t=='a':
            links+=1; r=re.search(r'\srel="([^"]*)"',a); rp=re.search(r'\sreferrerpolicy="([^"]*)"',a)
            rel[(r.group(1) if r else None, rp.group(1) if rp else None)]+=1
            if re.search(r'\starget="',a): tgt+=1
        if t=='img':
            imgs+=1; lazy+= bool(re.search(r'\sloading="lazy"',a))
print('tags',dict(tags.most_common(40)))
print('classes',dict(cls.most_common(20)))
print('noncustom per jam',{k:v for k,v in per.items() if v})
print('ids',ids,'style attrs',nst,dict(sty.most_common(15)))
print('iframes',dict(ifr))
print('links',links,'target',tgt,'rel',dict(rel))
print('imgs',imgs,'lazy',lazy)
