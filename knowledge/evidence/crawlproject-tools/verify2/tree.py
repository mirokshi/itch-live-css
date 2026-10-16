# Minimal HTML tree builder (stdlib only). Never prints text content, only tags/ids/classes.
import html.parser, sys, re
VOID={'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}
class N:
    __slots__=('tag','a','kids','up','text')
    def __init__(s,tag,a,up):
        s.tag=tag; s.a=dict(a); s.kids=[]; s.up=up; s.text=''
    @property
    def cls(s): return (s.a.get('class') or '').split()
    @property
    def id(s): return s.a.get('id')
    def sig(s):
        r=s.tag
        if s.id: r+='#'+s.id
        if s.cls: r+='.'+'.'.join(s.cls)
        return r
    def walk(s):
        yield s
        for k in s.kids: yield from k.walk()
    def find(s,pred): return [n for n in s.walk() if pred(n)]
    def has(s,c): return c in s.cls
class P(html.parser.HTMLParser):
    def __init__(s):
        super().__init__(convert_charrefs=True); s.root=N('#root',{},None); s.cur=s.root
    def handle_starttag(s,t,a):
        n=N(t,[(k,v or '') for k,v in a],s.cur); s.cur.kids.append(n)
        if t not in VOID: s.cur=n
    def handle_startendtag(s,t,a):
        n=N(t,[(k,v or '') for k,v in a],s.cur); s.cur.kids.append(n)
    def handle_endtag(s,t):
        c=s.cur
        while c is not s.root and c.tag!=t: c=c.up
        if c is not s.root: s.cur=c.up
    def handle_data(s,d):
        if s.cur.tag in ('style','script','title','textarea'): s.cur.text+=d
def load(path):
    p=P(); p.feed(open(path,encoding='utf-8',errors='replace').read()); return p.root
def byid(root,i):
    r=root.find(lambda n:n.id==i); return r[0] if r else None
def bycls(root,c): return root.find(lambda n:c in n.cls)
def chain(n):
    out=[]
    while n and n.tag!='#root': out.append(n.sig()); n=n.up
    return ' < '.join(out)
def kids(n,skip=('script',)): return [k for k in n.kids if k.tag not in skip]
