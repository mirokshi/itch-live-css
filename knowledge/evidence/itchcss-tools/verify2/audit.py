"""audit.py <bundle.css> <section...>  -- verifier's own bundle audit"""
import sys, re, collections, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import cssmini as C
sys.stdout.reconfigure(encoding='utf-8')
path = sys.argv[1]; want = set(sys.argv[2:]) or {'all'}
raw = open(path, encoding='utf8').read()
items = C.parse(raw)
rules = list(C.walk(items))
def on(k): return 'all' in want or k in want
name = os.path.basename(path)
print('#####', name, 'style rules:', len(rules), 'nested:', sum(r['nested'] for r in rules))

if on('ids'):
    ids = collections.Counter()
    for r in rules:
        for s in r['selectors']:
            for m in re.findall(r'#[-\w]+', re.sub(r'\[[^\]]*\]', '', s)):
                ids[m] += 1
    print('ID selectors:', dict(ids))

if on('maxspec'):
    best = []
    for r in rules:
        for s in r['selectors']:
            sp = C.spec(s)
            best.append((sp, s, r['ctx']))
    noid = sorted([b for b in best if b[0][0] == 0], reverse=True)[:6]
    print('top non-ID specificity:'); [print('  ', b[0], b[1], b[2]) for b in noid]
    withid = sorted([b for b in best if b[0][0] > 0], reverse=True)[:3]
    print('top ID specificity:'); [print('  ', b[0], b[1], b[2]) for b in withid]

if on('important'):
    n = 0
    for r in rules:
        imp = [d for d in r['decls'] if re.search(r'!\s*important', d, re.I)]
        if imp:
            n += len(imp)
            print('  !imp', ', '.join(r['selectors'])[:150], '|', '; '.join(imp)[:150], '|', r['ctx'])
    print('!important declarations total:', n)

if on('media'):
    cnt = collections.Counter()
    def count(items, ctx=()):
        for it in items:
            if it[0] == 'at' and it[2] is not None:
                cnt[it[1]] += sum(1 for x in it[2] if x[0] == 'rule')
                count(it[2], ctx + (it[1],))
    count(items)
    for k, v in sorted(cnt.items(), key=lambda x: -x[1]): print('  ', v, k)

if on('kf'):
    print('keyframes:', re.findall(r'@(?:-webkit-)?keyframes\s+([-\w]+)', raw))
    print('animation uses:', sorted(set(re.findall(r'animation(?:-name)?\s*:\s*([^;}]+)', raw)))[:40])

if on('z'):
    zs = collections.defaultdict(list)
    for r in rules:
        for d in r['decls']:
            m = re.match(r'z-index\s*:\s*(-?\d+)', d.strip())
            if m: zs[int(m.group(1))].append((', '.join(r['selectors'])[:110], r['ctx']))
    for z in sorted(zs, reverse=True):
        for s in zs[z]: print('  z', z, s[0], s[1] if s[1] else '')

if on('focus'):
    for r in rules:
        if any(':focus' in s for s in r['selectors']):
            print('  ', ', '.join(r['selectors'])[:140], '|', '; '.join(r['decls'])[:140], r['ctx'])

if on('queries'):
    for k in ('prefers-reduced-motion', 'prefers-color-scheme', 'print', '@layer', '@supports', '@container', 'focus-visible', 'dark_theme', 'no_theme_toggle', 'External link', '@import'):
        print('  ', k, raw.count(k))

if on('fonts'):
    for m in re.finditer(r'@font-face\s*\{([^}]*)\}', raw):
        b = m.group(1)
        fam = re.search(r'font-family\s*:\s*([^;]+)', b); w = re.search(r'font-weight\s*:\s*([^;]+)', b); st = re.search(r'font-style\s*:\s*([^;]+)', b)
        print('  @font-face', fam and fam.group(1).strip(), w and w.group(1).strip(), st and st.group(1).strip(), 'font-display' in b)
    for r in rules:
        if r['selectors'] in (['body'], ['html']) or any(s.startswith('body') and 'locale' in s for s in r['selectors']):
            print('  ', r['selectors'], '; '.join(r['decls'])[:200], r['ctx'])

if on('vars'):
    defined = collections.defaultdict(set); used = set()
    for r in rules:
        for d in r['decls']:
            m = re.match(r'\s*(--[-\w]+)\s*:', d)
            if m: defined[m.group(1)].add(', '.join(r['selectors'])[:60])
            for u in re.findall(r'var\(\s*(--[-\w]+)', d): used.add(u)
    print('  defined:', {k: sorted(v)[:3] for k, v in sorted(defined.items())})
    print('  used-not-defined:', sorted(u for u in used if u not in defined))

if on('trans'):
    vals = collections.Counter()
    for r in rules:
        for d in r['decls']:
            if re.match(r'\s*(transition|animation)\b', d):
                vals[d.strip()[:90]] += 1
    for k, v in vals.most_common(): print('  ', v, k)

if on('sel'):
    pat = re.compile(os.environ.get('SEL', 'XXXX'))
    for r in rules:
        if any(pat.search(s) for s in r['selectors']):
            print('  ', ', '.join(r['selectors'])[:160], '{', '; '.join(r['decls'])[:260], '}', r['ctx'])
