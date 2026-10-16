"""Summarize the sequence of stylesheet-ish <head> items (link rel=stylesheet, style#id) per file, and whether custom_css is the last element of <head>.
usage: python -I headseq.py <glob> [<glob>...]"""
import sys, glob, re, collections
from html.parser import HTMLParser
class P(HTMLParser):
    def __init__(s):
        super().__init__(convert_charrefs=True); s.inhead=False; s.done=False; s.seq=[]; s.last=None; s.pn=None; s.wrapper=False
    def handle_starttag(s,t,a):
        a=dict(a)
        if t=='head': s.inhead=True; return
        if t=='body': s.inhead=False; s.done=True; s.pn=a.get('data-page_name'); return
        if a.get('id')=='wrapper': s.wrapper=True
        if s.inhead and not s.done:
            s.last=(t,a.get('id'))
            if t=='link' and 'stylesheet' in (a.get('rel') or ''):
                h=a.get('href','')
                s.seq.append(re.sub(r'\?.*','',h.split('/')[-1]) if 'static.itch.io' in h else ('font-link' if 'fonts.googleapis' in h else 'link:'+h[:30]))
            elif t=='style': s.seq.append('style#'+str(a.get('id')))
    def handle_startendtag(s,t,a): s.handle_starttag(t,a)
    def handle_endtag(s,t):
        if t=='head': s.inhead=False; s.done=True
c=collections.Counter(); lastcc=collections.Counter(); n=0
for pat in sys.argv[1:]:
    for f in sorted(glob.glob(pat)):
        t=open(f,encoding='utf-8',errors='replace').read()
        if 'Too Many Requests' in t[:3000]: continue
        p=P(); p.feed(t); n+=1
        seq=' > '.join(re.sub(r'(font-link > )+','font-link+ > ',' > '.join(p.seq)+' > ').rstrip(' >').split(' > '))
        c[(p.pn, p.wrapper, seq)]+=1
        if 'style#custom_css' in p.seq: lastcc[p.last==('style','custom_css')]+=1
print('files',n)
for k,v in c.most_common(): print(v, k)
print('custom_css is last <head> element:', dict(lastcc))
