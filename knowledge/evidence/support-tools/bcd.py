import json,sys
d=json.load(open(sys.argv[1],encoding='utf-8'))
B=['chrome','edge','firefox','safari','safari_ios','chrome_android','firefox_android']
def get(path):
    n=d
    for p in path.split('.'):
        if p not in n: return None
        n=n[p]
    return n
def fmt(s):
    if isinstance(s,dict): s=[s]
    out=[]
    for e in s:
        t=str(e.get('version_added'))
        if e.get('version_removed'): t+='-'+str(e['version_removed'])
        if e.get('prefix'): t+='(prefix '+e['prefix']+')'
        if e.get('alternative_name'): t+='(alt '+e['alternative_name']+')'
        if e.get('flags'): t+='(flag)'
        if e.get('partial_implementation'): t+='(partial)'
        if e.get('notes'):
            n=e['notes']; n=n if isinstance(n,str) else ' / '.join(n)
            t+='{'+n[:160]+'}'
        out.append(t)
    return ' ; '.join(out)
def show(path,depth):
    n=get(path)
    if n is None: print('MISSING',path); return
    c=n.get('__compat')
    if c:
        st=c.get('status',{})
        print(f"## {path}  std={st.get('standard_track')} exp={st.get('experimental')} dep={st.get('deprecated')} url={c.get('mdn_url','')}")
        for b in B:
            print(f"   {b}: {fmt(c['support'].get(b,'?'))}")
    if depth>0:
        for k in n:
            if k!='__compat': show(path+'.'+k,depth-1)
depth=int(sys.argv[2])
for p in sys.argv[3:]: show(p,depth)
