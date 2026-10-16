# DOM skeleton printer (stdlib only). usage: python -I skel.py page.html [maxdepth] [#id|.class|tag]
# Collapses runs of identical siblings as (xN); prints id, classes and a few attributes; never prints text content.
import sys, re
from html.parser import HTMLParser
VOID={'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}
class N:
    def __init__(s,tag,attrs,parent):
        s.tag=tag; s.a=dict(attrs); s.p=parent; s.c=[]; s.text=''
class P(HTMLParser):
    def __init__(s):
        super().__init__(convert_charrefs=True); s.root=N('#root',[],None); s.cur=s.root
    def handle_starttag(s,tag,attrs):
        n=N(tag,attrs,s.cur); s.cur.c.append(n)
        if tag not in VOID: s.cur=n
    def handle_startendtag(s,tag,attrs):
        s.cur.c.append(N(tag,attrs,s.cur))
    def handle_endtag(s,tag):
        x=s.cur
        while x is not None and x.tag!=tag: x=x.p
        if x is not None and x.p is not None: s.cur=x.p
def label(n):
    l=n.tag
    if n.a.get('id'): l+='#'+n.a['id']
    if n.a.get('class'): l+='.'+'.'.join(n.a['class'].split())
    extra=[]
    for k in ('data-type','data-label','role','data-iframe','data-width','data-height','frameborder','allow','sandbox','allowfullscreen','scrolling','aria-hidden'):
        if k in n.a: extra.append(f'{k}' + (f'="{n.a[k][:40]}"' if n.a[k] else ''))
    if n.tag=='iframe' and n.a.get('src'): extra.append('src-host='+re.sub(r'^(https?:)?//([^/]+).*',r'\2',n.a['src']))
    if extra: l+=' ['+' '.join(extra)+']'
    return l
def show(n,d,maxd,out):
    if d>maxd: return
    prev=None; cnt=0
    kids=[k for k in n.c if k.tag not in ('script','style','noscript','br')]
    i=0
    while i<len(kids):
        k=kids[i]; lab=label(k); j=i
        while j+1<len(kids) and label(kids[j+1])==lab: j+=1
        rep=j-i+1
        out.append('  '*d+lab+(f'  (x{rep})' if rep>1 else ''))
        show(k,d+1,maxd,out)
        i=j+1
def find(n,pred):
    if pred(n): return n
    for k in n.c:
        r=find(k,pred)
        if r: return r
p=P(); p.feed(open(sys.argv[1],encoding='utf-8').read())
maxd=int(sys.argv[2]) if len(sys.argv)>2 else 6
start=p.root
if len(sys.argv)>3:
    sel=sys.argv[3]
    if sel.startswith('#'): start=find(p.root,lambda n:n.a.get('id')==sel[1:])
    elif sel.startswith('.'): start=find(p.root,lambda n:sel[1:] in (n.a.get('class') or '').split())
    else: start=find(p.root,lambda n:n.tag==sel)
out=[label(start)] if start is not p.root else []
show(start,1,maxd,out)
print('\n'.join(out))
