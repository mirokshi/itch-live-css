# usage: python -I an.py page.html [selector ...]   (selectors: #id, .class, .a.b, tag#id)
import sys, re, hashlib
from html.parser import HTMLParser
VOID={'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}
class P(HTMLParser):
    def __init__(s):
        super().__init__(convert_charrefs=True); s.stack=[]; s.els=[]; s.styles=[]; s.cur=None; s.body=None
    def handle_starttag(s,t,a):
        a=dict(a); el={'tag':t,'id':a.get('id'),'cls':(a.get('class') or '').split(),'attrs':a,'parent':s.stack[-1] if s.stack else None,'pos':s.getpos()}
        s.els.append(el)
        if t=='body': s.body=a
        if t=='style': s.cur={'id':a.get('id'),'text':''}
        if t not in VOID: s.stack.append(el)
    def handle_endtag(s,t):
        if t=='style' and s.cur is not None: s.styles.append(s.cur); s.cur=None
        for i in range(len(s.stack)-1,-1,-1):
            if s.stack[i]['tag']==t: del s.stack[i:]; break
    def handle_data(s,d):
        if s.cur is not None: s.cur['text']+=d
raw=open(sys.argv[1],encoding='utf-8',errors='replace').read()
p=P(); p.feed(raw)
print('body attrs:', {k:v for k,v in (p.body or {}).items() if k in('class','data-page_name')})
for st in p.styles:
    t=st['text']; print('style#%s len=%d sha1=%s wrapper=%d important=%d @media=%d @import=%d data:=%d'%(st['id'],len(t),hashlib.sha1(t.encode()).hexdigest()[:12],t.count('#wrapper'),t.count('!important'),t.count('@media'),t.count('@import'),t.count('data:')))
def match(el,sel):
    m=re.match(r'^([a-z0-9]*)(#[\w-]+)?((?:\.[\w-]+)*)$',sel)
    tag,i,cl=m.group(1),m.group(2),m.group(3)
    if tag and el['tag']!=tag: return False
    if i and el['id']!=i[1:]: return False
    for c in [c for c in cl.split('.') if c]:
        if c not in el['cls']: return False
    return True
def path(el):
    out=[]
    while el:
        out.append(el['tag']+('#'+el['id'] if el['id'] else '')+('.'+'.'.join(el['cls'][:3]) if el['cls'] else '')); el=el['parent']
    return ' < '.join(out[:6])
for sel in sys.argv[2:]:
    hits=[e for e in p.els if match(e,sel)]
    inw=0
    for e in hits:
        x=e['parent']
        while x:
            if x['id']=='wrapper': inw+=1; break
            x=x['parent']
    print('%-28s n=%d inside#wrapper=%d first=%s'%(sel,len(hits),inw,path(hits[0]) if hits else '-'))
