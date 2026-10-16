import json,sys,re
sys.stdout.reconfigure(encoding='utf-8')
wf=json.load(open(sys.argv[1],encoding='utf-8'))['features']; bcd=json.load(open(sys.argv[2],encoding='utf-8'))
def node(k):
    n=bcd
    for p in k.split('.'):
        if p not in n: return None
        n=n[p]
    return n.get('__compat',{}).get('support')
def full(e):
    if e is None: return None
    if isinstance(e,dict): e=[e]
    x=e[0]
    if x.get('flags') or x.get('prefix') or x.get('partial_implementation') or x.get('version_removed') or x.get('alternative_name'): return None
    v=x.get('version_added'); return v if v not in (False,None,'preview') else None
for fid in sys.argv[3].split(','):
    f=wf[fid]; print('==',fid, f['status'].get('baseline'), f['status'].get('support'))
    for k in f.get('compat_features',[]):
        s=node(k)
        if not s: print('   (no bcd)',k); continue
        row={b:full(s.get(b)) for b in ['chrome','firefox','safari','safari_ios']}
        if any(v is None for v in row.values()) or len(sys.argv)>4: print('  ',k,row)
