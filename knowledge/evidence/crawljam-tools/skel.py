# usage: python -I skel.py file.html [maxdepth] [root_selector_id_or_tag]
# prints a sanitized DOM skeleton of <body>: tag#id.classes, collapsing runs of identical siblings, no text/attrs
import sys,re
from html.parser import HTMLParser
sys.stdout.reconfigure(encoding='utf-8')
VOID={'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}
SKIP_INNER={'svg','script','style','noscript'}
class N:
    def __init__(s,tag,attrs,parent):
        s.tag=tag;s.a=dict(attrs);s.c=[];s.p=parent
    def label(s):
        l=s.tag
        i=s.a.get('id')
        if i:
            i=re.sub(r'\d{3,}','N',i); l+='#'+i
        cl=(s.a.get('class') or '').split()
        if cl: l+='.'+'.'.join(cl)
        extra=[]
        for k in ('data-label','role','type','name'):
            if k in s.a and s.tag in ('input','select','form','button','section','div','nav') : extra.append(f'{k}={s.a[k]}')
        if extra: l+=' ['+' '.join(extra)+']'
        return l
class P(HTMLParser):
    def __init__(s):
        super().__init__(convert_charrefs=True); s.root=N('#root',[],None); s.cur=s.root; s.skip=0
    def handle_starttag(s,t,a):
        n=N(t,a,s.cur); s.cur.c.append(n)
        if t not in VOID: s.cur=n
    def handle_startendtag(s,t,a):
        s.cur.c.append(N(t,a,s.cur))
    def handle_endtag(s,t):
        x=s.cur
        while x is not None and x.tag!=t: x=x.p
        if x is not None and x.p is not None: s.cur=x.p
def sig(n,d=0):
    if d>3: return n.label()
    return n.label()+'('+','.join(sig(c,d+1) for c in n.c)+')'
def out(n,depth,maxd):
    if depth>maxd: return
    kids=n.c; i=0
    while i<len(kids):
        k=kids[i]; j=i+1
        while j<len(kids) and kids[j].label()==k.label(): j+=1
        rep=j-i
        print('  '*depth+k.label()+(f'  ×{rep}' if rep>1 else ''))
        if k.tag not in SKIP_INNER: out(k,depth+1,maxd)
        i=j
def find(n,pred):
    if pred(n): return n
    for c in n.c:
        r=find(c,pred)
        if r: return r
p=P(); p.feed(open(sys.argv[1],encoding='utf8').read())
maxd=int(sys.argv[2]) if len(sys.argv)>2 else 12
root=find(p.root,lambda n:n.tag=='body')
if len(sys.argv)>3:
    sel=sys.argv[3]
    root=find(p.root,lambda n:n.a.get('id')==sel or sel in (n.a.get('class') or '').split())
print(root.label())
out(root,1,maxd)
