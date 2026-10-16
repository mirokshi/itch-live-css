import sys, os, re
sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from analyze import summary
from cssparse import specificity, split_selectors

path = sys.argv[1]
what = sys.argv[2]
arg = sys.argv[3] if len(sys.argv) > 3 else None
s = summary(path)

def fmt(r):
    ctx = ' / '.join(r['ctx'])
    d = ';'.join(f"{p}:{v}{' !important' if i else ''}" for p, v, i in r['decls'])
    return (f"[{ctx}] " if ctx else '') + f"{r['sel']} {{{d}}}"

if what == 'vardefs':
    for r in s['rules']:
        if any(p.startswith('--') for p, v, i in r['decls']):
            print(fmt(r)[:600])
elif what == 'important':
    for x in s['important']: print(x)
elif what == 'z':
    for x in sorted(s['zindex'], key=lambda t: -int(t[0]) if re.match(r'-?\d+$', t[0]) else 0): print(x)
elif what == 'focus':
    for x in s['focus']: print(x[2], '|', x[0], '|', x[1])
elif what == 'trans':
    for x in s['transitions']: print(x)
elif what == 'media':
    for r in s['rules']:
        if any(arg in c for c in r['ctx']): print(fmt(r)[:400])
elif what == 'sel':
    pat = re.compile(arg)
    for r in s['rules']:
        if pat.search(r['sel']): print(fmt(r)[:500])
elif what == 'prop':
    for r in s['rules']:
        for p, v, i in r['decls']:
            if re.fullmatch(arg, p): print(' / '.join(r['ctx']), '|', r['sel'][:200], '|', p, v, i)
elif what == 'spec':
    import collections
    c = collections.Counter()
    for r in s['rules']:
        for sel in split_selectors(r['sel']):
            c[specificity(sel)] += 1
    for k, v in sorted(c.items(), key=lambda t: -t[1])[:25]: print(k, v)
    mx = max(c)
    print('max', mx)
    for r in s['rules']:
        for sel in split_selectors(r['sel']):
            if specificity(sel)[0] >= 1: print('ID-sel:', sel, specificity(sel))
