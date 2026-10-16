# Print chrome/firefox/safari/safari_ios support for BCD entries whose path contains a filter string.
import json,sys,os
sys.stdout.reconfigure(encoding='utf-8')
d,files,filt=sys.argv[1],sys.argv[2].split(','),sys.argv[3].split('|')
def fmt(x):
    if isinstance(x,str): return x
    t=str(x.get('version_added'))
    for k in ('prefix','alternative_name'):
        if x.get(k): t+=f'({k} {x[k]})'
    if x.get('partial_implementation'): t+='(partial)'
    if x.get('version_removed'): t+='(removed '+str(x['version_removed'])+')'
    if x.get('flags'): t+='(flag)'
    if x.get('notes'):
        n=x['notes']; n=' '.join(n) if isinstance(n,list) else n; t+=' [note: '+n[:220]+']'
    return t
def walk(node,path):
    if '__compat' in node and any(f in '/'.join(path) for f in filt):
        s=node['__compat'].get('support',{}); print('/'.join(path))
        for b in ['chrome','firefox','safari','safari_ios']:
            v=s.get(b)
            if v is None: continue
            vs=v if isinstance(v,list) else [v]; print('   ',b,'=',' ; '.join(fmt(x) for x in vs))
    for k,v in node.items():
        if k!='__compat' and isinstance(v,dict): walk(v,path+[k])
for f in files: walk(json.load(open(os.path.join(d,f),encoding='utf8')),[f[:-5]])
