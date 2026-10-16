import sys, os
sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cssparse import parse, strip_comments, specificity, split_selectors
css = strip_comments(open(sys.argv[1], encoding='utf8').read())
for r in parse(css):
    if not r.get('sel'): continue
    imp = any(i for p,v,i in r['decls'])
    props = ','.join(sorted(set(p for p,v,i in r['decls'])))
    for sel in split_selectors(r['sel']):
        print(f"{str(specificity(sel)):10} {'!imp' if imp else '    '} {'nested' if r.get('nested') else '      '} {sel[:90]:90} {props[:80]}")
