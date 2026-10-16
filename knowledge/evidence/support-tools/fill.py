import json,sys
sys.stdout.reconfigure(encoding='utf-8')
t=open(sys.argv[1],encoding='utf-8').read()
matrix=open(sys.argv[2],encoding='utf-8').read().strip()
probe=open(sys.argv[3],encoding='utf-8').read().strip()
probe=probe.replace('| id | test | chromium147 | chrome155 | chrome155-exp | chrome155-dark |','| id | test | Chrome 147 | Chrome 155 | 155 + exp. flag | 155 + dark |',1)
a=json.load(open(sys.argv[4],encoding='utf-8'))
rows=['| element (all `<h2>`) | CSS | accessible name |','|---|---|---|']
css={'t-plain':r'`::before{content:"\2605 "}`','t-alt-empty':r'`::before{content:"\2605 " / ""}`','t-alt-text':r'`::before{content:"\2605 " / "Rated: "}`','t-fallback':r'`content:"\2605 "; content:"\2605 " / ""`','t-transparent':'`<span>` Hi! with `color:transparent`','t-vis-hidden':'`<span>` Hi! with `visibility:hidden`','t-disp-none':'`<span>` Hi! with `display:none`','t-roller':r'roller: transparent `<span>`Hi! + `::before{content:"Hola\A Ciao\A Hallo" / ""}`'}
for r in a['results']:
    rows.append(f"| `#{r['id']}` | {css[r['id']]} | `{r['name']}` |")
t=t.replace('{{MATRIX}}',matrix).replace('{{PROBE}}',probe).replace('{{A11Y}}','Browser: '+a['browser']+'\n\n'+'\n'.join(rows))
open(sys.argv[5],'w',encoding='utf-8').write(t)
print('ok', len(t))
