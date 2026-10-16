import sys
from html.parser import HTMLParser
sys.stdout.reconfigure(encoding="utf-8")
# usage: dom.py page.html [selectors...] -- for each '#id' or '.class' (dot-joined = all classes): count of elements, inside #wrapper?, first element path
VOID={'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}
class P(HTMLParser):
    def __init__(s):
        super().__init__(); s.stack=[]; s.els=[]
    def handle_starttag(s,t,a):
        a=dict(a); cls=(a.get('class') or '').split(); i=a.get('id')
        label=t+('#'+i if i else '')+''.join('.'+c for c in cls)
        s.els.append((t,i,set(cls),[x for x in s.stack]+[label]))
        if t not in VOID: s.stack.append(label)
    def handle_startendtag(s,t,a):
        s.handle_starttag(t,a)
        if t not in VOID and s.stack: s.stack.pop()
    def handle_endtag(s,t):
        if t in VOID: return
        for k in range(len(s.stack)-1,-1,-1):
            if s.stack[k].split('#')[0].split('.')[0]==t:
                del s.stack[k:]; break
p=P(); p.feed(open(sys.argv[1],encoding='utf-8',errors='replace').read())
for sel in sys.argv[2:]:
    if sel.startswith('#'): f=lambda e,v=sel[1:]: e[1]==v
    elif sel.startswith('.'): 
        need=set(sel[1:].split('.')); f=lambda e,n=need: n<=e[2]
    else: f=lambda e,v=sel: e[0]==v
    hits=[e for e in p.els if f(e)]
    inw=[e for e in hits if any(x.split('.')[0].endswith('#wrapper') for x in e[3][:-1])]
    print('%-28s n=%d inside#wrapper=%d  %s'%(sel,len(hits),len(inw),(' > '.join(x[:60] for x in hits[0][3][-5:]) if hits else '')))
