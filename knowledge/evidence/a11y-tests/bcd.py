import json,sys,os
d=sys.argv[1]; files=sys.argv[2].split(','); filt=sys.argv[3] if len(sys.argv)>3 else ''
def fmt(x):
    if isinstance(x,str): return x
    t=str(x.get('version_added'))
    if x.get('prefix'): t+='(prefix '+x['prefix']+')'
    if x.get('partial_implementation'): t+='(partial)'
    if x.get('version_removed'): t+='(removed '+str(x['version_removed'])+')'
    if x.get('alternative_name'): t+='(alt '+x['alternative_name']+')'
    if x.get('flags'): t+='(flag)'
    if x.get('notes'):
        n=x['notes']; n=' '.join(n) if isinstance(n,list) else n
        t+='[note: '+n[:260]+']'
    return t
def walk(node,path):
    if '__compat' in node:
        s=node['__compat'].get('support',{})
        if filt in '/'.join(path):
            print('/'.join(path))
            for b in ['chrome','firefox','safari','safari_ios']:
                v=s.get(b)
                if v is None: continue
                vs=v if isinstance(v,list) else [v]
                print('   ',b,'=',' ; '.join(fmt(x) for x in vs))
    for k,v in node.items():
        if k!='__compat' and isinstance(v,dict): walk(v,path+[k])
for f in files: walk(json.load(open(os.path.join(d,f),encoding='utf8')),[f[:-5]])
