import json,sys,re
sys.stdout.reconfigure(encoding='utf-8')
bcd=json.load(open(sys.argv[1],encoding='utf-8'))
ciu=json.load(open(sys.argv[2],encoding='utf-8'))
MAP={'chrome':'chrome','edge':'edge','firefox':'firefox','safari':'safari','ios_saf':'safari_ios','and_chr':'chrome_android','and_ff':'firefox_android','samsung':'samsunginternet_android','opera':'opera','op_mob':'opera_android','android':'webview_android'}
def num(v):
    m=re.match(r'[≤]?(\d+(?:\.\d+)?)',str(v)); return tuple(int(x) for x in m.group(1).split('.')) if m else None
def get(path):
    n=bcd
    for p in path.split('.'): n=n[p]
    return n['__compat']['support']
def full_version(entries):
    if isinstance(entries,dict): entries=[entries]
    best=None
    for e in entries:
        if e.get('prefix') or e.get('flags') or e.get('alternative_name') or e.get('partial_implementation'): continue
        if e.get('version_removed'): continue
        va=e.get('version_added')
        if va in (False,None,'preview'): continue
        if va is True: return (0,)
        n=num(va)
        if n and (best is None or n<best): best=n
    return best
def coverage(path):
    sup=get(path); tot=0
    for agent,b in MAP.items():
        fv=full_version(sup.get(b,[])) if b in sup else None
        if fv is None: continue
        for ver,u in ciu['agents'][agent]['usage_global'].items():
            if not u: continue
            n=num(ver.split('-')[0])
            if n and n>=fv: tot+=u
    return tot
rows=[l.split('=',1) for l in sys.argv[3:]]
print('| feature | BCD key | % global users (full support) |')
print('|---|---|---|')
for name,path in rows:
    print(f'| {name} | `{path}` | {coverage(path):.1f} |')
