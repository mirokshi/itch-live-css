# usage: sk.py file.html selector depth   selector: #id or .class or tag ; prints first match subtree skeleton (no text)
import sys, os, re
sys.path.insert(0, os.path.dirname(__file__))
from tree import load
path, sel, depth = sys.argv[1], sys.argv[2], int(sys.argv[3])
nth = int(sys.argv[4]) if len(sys.argv)>4 else 0
attrs = sys.argv[5].split(',') if len(sys.argv)>5 else []
r=load(path)
def m(n):
    if sel.startswith('#'): return n.id==sel[1:]
    if sel.startswith('.'): return all(c in n.cls for c in sel[1:].split('.'))
    return n.tag==sel
hits=[n for n in r.walk() if m(n)]
print(f'# {len(hits)} matches')
if not hits: sys.exit()
def sig(n):
    s=re.sub(r'_\d+\b','_N',n.sig())
    ex=[f'{a}' + ('=' + n.a[a][:40] if a in attrs else '') for a in n.a if a not in ('id','class')]
    if ex: s+='['+','.join(ex)+']'
    return s
def pr(n,d,ind):
    out=[]; prev=None; cnt=0
    ks=[k for k in n.kids if k.tag not in ('script',)]
    lines=[]
    for k in ks:
        sub=[]; pr2(k,d,ind+1,sub)
        key='\n'.join(sub)
        if lines and lines[-1][0]==key: lines[-1][1]+=1
        else: lines.append([key,1])
    for key,c in lines:
        first,_,rest=key.partition('\n')
        print(first+(f'  (x{c})' if c>1 else '')); 
        if rest: print(rest)
def pr2(n,d,ind,sub):
    sub.append('  '*ind+sig(n))
    if d<=0: return
    ks=[k for k in n.kids if k.tag not in ('script',)]
    groups=[]
    for k in ks:
        s2=[]; pr2(k,d-1,ind+1,s2); key='\n'.join(s2)
        if groups and groups[-1][0]==key: groups[-1][1]+=1
        else: groups.append([key,1])
    for key,c in groups:
        first,_,rest=key.partition('\n')
        sub.append(first+(f'  (x{c})' if c>1 else ''))
        if rest: sub.append(rest)
h=hits[nth]; s=[]; pr2(h,depth,0,s); print('\n'.join(s))
