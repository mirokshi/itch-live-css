# usage: python -I tree.py file maxdepth [rootclass]  -> tag#id.class skeleton (digits in ids -> N), collapses repeated siblings
import sys,re
from html.parser import HTMLParser
sys.stdout.reconfigure(encoding='utf-8')
VOID={'img','br','hr','meta','link','input','source','area','base','col','embed','param','track','wbr'}
class P(HTMLParser):
    def __init__(s):
        super().__init__(convert_charrefs=True); s.root={'t':'#root','c':[]}; s.st=[s.root]
    def handle_starttag(s,t,a):
        a=dict(a); i=a.get('id'); c=a.get('class')
        lab=t+('#'+re.sub(r'\d+','N',i) if i else '')+(''.join('.'+x for x in c.split()) if c else '')
        for k in ('data-name','data-page_name'):
            if k in a: lab+='[%s=%s]'%(k,a[k])
        n={'t':lab,'c':[]}; s.st[-1]['c'].append(n)
        if t not in VOID: s.st.append(n)
    def handle_endtag(s,t):
        for j in range(len(s.st)-1,0,-1):
            if s.st[j]['t'].split('#')[0].split('.')[0].split('[')[0]==t: del s.st[j:]; break
p=P(); p.feed(open(sys.argv[1],encoding='utf8').read())
D=int(sys.argv[2]); R=sys.argv[3] if len(sys.argv)>3 else None
def find(n):
    if R and R in n['t']: return n
    for c in n['c']:
        r=find(c)
        if r: return r
def pr(n,d,ind):
    if d>D: return
    prev=None;cnt=0;out=[]
    for c in n['c']:
        if c['t'].startswith(('script','svg','path','br','option','g','span.svgicon')): continue
        out.append(c)
    i=0
    while i<len(out):
        j=i
        while j+1<len(out) and out[j+1]['t']==out[i]['t']: j+=1
        print('  '*ind+out[i]['t']+(' x%d'%(j-i+1) if j>i else ''))
        pr(out[i],d+1,ind+1); i=j+1
r=find(p.root) if R else p.root
print(r['t']); pr(r,1,1)
