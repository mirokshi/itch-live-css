import json,sys
sys.stdout.reconfigure(encoding='utf-8')
d=json.load(open(sys.argv[1],encoding='utf-8'))
B=['chrome','edge','firefox','safari','safari_ios']
def short(e):
    if e is None: return '-'
    if isinstance(e,dict): e=[e]
    out=[]
    for x in e:
        s=str(x.get('version_added'))
        if x.get('version_removed'): s+='-'+str(x['version_removed'])
        if x.get('partial_implementation'): s+='(partial)'
        if x.get('prefix'): s+='(prefix '+x['prefix']+')'
        if x.get('alternative_name'): s+='(alt '+x['alternative_name']+')'
        if x.get('flags'): s+='(flag)'
        n=x.get('notes')
        if n: s+=' [notes: '+(' | '.join(n) if isinstance(n,list) else n)[:300]+']'
        out.append(s)
    return ' ; '.join(out)
def walk(n,k,depth):
    c=n.get('__compat')
    if c:
        print('##',k)
        for b in B: print('   ',b,short(c['support'].get(b)))
    if depth>0:
        for ch in n:
            if ch!='__compat': walk(n[ch],k+'.'+ch,depth-1)
for k in sys.argv[3:]:
    n=d
    for p in k.split('.'):
        n=n.get(p) if isinstance(n,dict) else None
        if n is None: break
    if n is None: print('##',k,'MISSING'); continue
    walk(n,k,int(sys.argv[2]))
