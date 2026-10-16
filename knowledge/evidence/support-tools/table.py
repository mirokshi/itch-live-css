import sys; sys.stdout.reconfigure(encoding="utf-8")
import json,sys,re,html
cols=[]
for f in sys.argv[1:]:
    t=open(f,encoding='utf-8').read()
    m=re.search(r'PROBE_JSON=(.*?)</pre>',t,re.S)
    js=html.unescape(m.group(1))
    d=json.loads(js)
    cols.append((f.split('/')[-1].replace('.html',''),{r['id']:r for r in d['results']}, [r['id'] for r in d['results']]))
ids=cols[0][2]
print('| id | test | '+' | '.join(c[0] for c in cols)+' |')
print('|---|---|'+'---|'*len(cols))
for i in ids:
    r0=cols[0][1][i]
    cells=[]
    for name,m,_ in cols:
        r=m.get(i)
        cells.append(('Y' if r['ok'] else 'n')+((' '+r['detail'][:40]) if r['detail'] else ''))
    print(f"| {i} | `{r0['kind']}: {r0['test'][:70]}` | "+' | '.join(c.replace('|','/') for c in cells)+' |')
