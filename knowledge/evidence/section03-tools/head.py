"""Dump all <head> children (tag, id, rel, src/href basename, size of inline text). usage: python -I head.py file.html"""
import sys, re
from html.parser import HTMLParser
class P(HTMLParser):
    def __init__(s):
        super().__init__(convert_charrefs=True); s.inhead=False; s.items=[]; s.cur=None; s.done=False
    def handle_starttag(s, t, a):
        a=dict(a)
        if t=='head': s.inhead=True; return
        if t=='body': s.inhead=False; s.done=True; return
        if s.inhead and not s.done:
            u=a.get('src') or a.get('href') or a.get('data-src') or ''
            u=re.sub(r'\?.*','',u); u=u.split('/')[-1] if 'static.itch.io' in u else re.sub(r'^https?://([^/]+).*',r'\1',u)
            s.cur=[t,a.get('id') or '',a.get('rel') or a.get('name') or a.get('property') or '',u,0]; s.items.append(s.cur)
    def handle_startendtag(s,t,a): s.handle_starttag(t,a)
    def handle_data(s,d):
        if s.inhead and s.cur and s.cur[0] in ('style','script'): s.cur[4]+=len(d)
    def handle_endtag(s,t):
        if t=='head': s.inhead=False; s.done=True
p=P(); p.feed(open(sys.argv[1],encoding='utf-8',errors='replace').read())
for i,(t,i_,r,u,n) in enumerate(p.items):
    if t in ('meta',) : continue
    print(f'{i:2d} {t:6s} id={i_:12s} rel={r:12s} {u:40s} inline={n}')
