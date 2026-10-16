import sys, re, os, collections
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import cssmini as C
sys.stdout.reconfigure(encoding='utf-8')
raw_dir, out_dir = sys.argv[1], sys.argv[2]
for f in sorted(os.listdir(raw_dir)):
    if not f.endswith('.html'): continue
    s = open(os.path.join(raw_dir, f), encoding='utf8').read()
    for m in re.finditer(r'<style[^>]*id="(\w+_theme|custom_css)"[^>]*>(.*?)</style>', s, re.S):
        sid, body = m.group(1), m.group(2)
        open(os.path.join(out_dir, f[:-5] + '.' + sid + '.css'), 'w', encoding='utf8').write(body)
        if sid == 'custom_css': continue
        items = C.parse(body); rules = list(C.walk(items))
        nested = sum(r['nested'] for r in rules)
        # raw nesting check: a '{' inside a rule body before its '}'
        sp = []
        for r in rules:
            for sel in r['selectors']:
                sp.append((C.spec(sel), sel))
        sp.sort(reverse=True)
        imps = [(', '.join(r['selectors'])[:120], '; '.join(d for d in r['decls'] if 'important' in d)[:120]) for r in rules if any('important' in d for d in r['decls'])]
        print('==', f, sid, 'len', len(body), 'rules', len(rules), 'nested', nested, 'max', sp[0] if sp else None)
        print('   top5:', [(a, b[:70]) for a, b in sp[:5]])
        print('   !important rules:', len(imps))
        for i in imps: print('     ', i)
