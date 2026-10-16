# Print BCD support for selected keys. usage: python -I bcd2.py <dir> file.json:dotted.path [...]
import json,sys,os
sys.stdout.reconfigure(encoding='utf-8')
d=sys.argv[1]
def f(x):
    if isinstance(x,str): return x
    t=str(x.get('version_added'))
    for k in ('prefix','alternative_name'):
        if x.get(k): t+=f'({k} {x[k]})'
    if x.get('partial_implementation'): t+='(partial)'
    if x.get('version_removed'): t+=f"(removed {x['version_removed']})"
    if x.get('flags'): t+='(flag)'
    if x.get('notes'):
        n=x['notes']; n=' | '.join(n) if isinstance(n,list) else n; t+=' [note: '+n[:220]+']'
    return t
for arg in sys.argv[2:]:
    fn,path=arg.split(':')
    node=json.load(open(os.path.join(d,fn),encoding='utf8'))
    for k in path.split('.'): node=node[k]
    s=node['__compat']['support']
    print('==',path)
    for b in ['chrome','firefox','safari','safari_ios']:
        v=s.get(b); vs=v if isinstance(v,list) else [v]
        print('   ',b.ljust(10),' ; '.join(f(x) for x in vs if x))
