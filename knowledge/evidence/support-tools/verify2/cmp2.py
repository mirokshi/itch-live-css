import json,re,html,sys
sys.stdout.reconfigure(encoding='utf-8')
rd=sys.argv[1]; md=sys.argv[2]
def load(f):
    t=open(f,encoding='utf-8').read(); m=re.search(r'PROBE_JSON=(.*?)</pre>',t,re.S)
    if not m:
        m=re.search(r'<pre id="out">(.*?)</pre>',t,re.S)
    s=html.unescape(m.group(1)).strip()
    if s.startswith('PROBE_JSON='): s=s[11:]
    d=json.loads(s); return d.get('ua'),{r['id']:r for r in d['results']}
runs={k:load(f'{rd}/{k}.html') for k in ['c147','c155','c155x']}
for k,(ua,_) in runs.items(): print(k,ua)
theirs={}
for line in open(md,encoding='utf-8').read().splitlines():
    m=re.match(r'\| ([a-z0-9-]+) \| `[^`]*` \| (.*) \|$',line)
    if m and line.count('|')>=7:
        cells=[c.strip() for c in m.group(2).split(' | ')]
        theirs[m.group(1)]=[c[:1] for c in cells]
diff=0
for i,r in runs['c155'][1].items():
    mine=['Y' if runs[k][1][i]['ok'] else 'n' for k in ['c147','c155','c155x']]
    t=theirs.get(i)
    if t is None: print('NOT IN TABLE',i); continue
    if t[:3]!=mine: diff+=1; print('DIFF',i,'theirs',t[:3],'mine',mine)
print('rows',len(runs['c155'][1]),'diffs',diff)
for i in sys.argv[3:]:
    print(i,[runs[k][1][i]['detail'][:90] for k in ['c147','c155','c155x']])
