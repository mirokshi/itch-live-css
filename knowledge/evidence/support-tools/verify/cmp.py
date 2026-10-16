import json,re,html,sys
sys.stdout.reconfigure(encoding='utf-8')
def load(f):
    t=open(f,encoding='utf-8').read(); m=re.search(r'PROBE_JSON=(.*?)</pre>',t,re.S)
    d=json.loads(html.unescape(m.group(1))); return d['ua'],{r['id']:r for r in d['results']}
runs={k:load(f'runs/{k}.html') for k in ['c147','c155','c155x','edge']}
for k,(ua,_) in runs.items(): print(k,ua)
# their table
md=open(sys.argv[1],encoding='utf-8').read()
theirs={}
for line in md.splitlines():
    m=re.match(r'\| ([a-z0-9-]+) \| `[^`]*` \| (.*) \|$',line)
    if m and line.count('|')>=7:
        cells=[c.strip() for c in m.group(2).split(' | ')]
        theirs[m.group(1)]=[c[:1] for c in cells]
diff=0
for i,r in runs['c155'][1].items():
    mine=['Y' if runs[k][1][i]['ok'] else 'n' for k in ['c147','c155','c155x']]
    t=theirs.get(i)
    if t is None: print('NOT IN TABLE',i); continue
    if t[:3]!=mine: diff+=1; print('DIFF',i,'theirs',t[:3],'mine',mine,[runs[k][1][i]['detail'][:50] for k in ['c147','c155','c155x']])
    e=runs['edge'][1][i]['ok']; 
    if e!=runs['c155'][1][i]['ok']: print('EDGE differs',i,e)
print('rows',len(runs['c155'][1]),'diffs',diff)
for i in ['random-fx','random-shared-fx','random-stable-on-restyle','invalid-value-falls-back-to-previous','var-hides-invalid-value','light-dark-color-scheme-light-dark-fx','env-prefers-dark','gotcha-fixed-inside-backdrop-filter','scope-colon-scope-adds-specificity','scope-ampersand-specificity','animation-shorthand-resets-timeline']:
    print(i,[runs[k][1][i]['detail'][:70] for k in ['c147','c155','c155x']])
