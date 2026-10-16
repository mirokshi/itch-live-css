# usage: python -I audit.py <rawdir>
# Counts at-rules, !important, ID selectors and var() consumers in itch's static CSS, and greps the JS
# for the runtime grid-sizer <style>.
import sys, re, os
sys.stdout.reconfigure(encoding="utf-8")
d = sys.argv[1]

def strip(css):
    return re.sub(r'/\*.*?\*/', '', css, flags=re.S)

for f in ('user.css', 'game.css', 'jam.css'):
    css = strip(open(os.path.join(d, f), encoding='utf-8', errors='replace').read())
    kf = sorted(set(re.findall(r'@(?:-webkit-)?keyframes\s+([\w-]+)', css)))
    print(f'== {f}: {len(css)} chars')
    print('  @keyframes names:', len(kf), kf)
    for at in ('@property', '@layer', '@import', '@scope', '@container', '@supports', '@media'):
        print(f'  {at}:', len(re.findall(re.escape(at) + r'\b', css)))
    print('  !important:', len(re.findall(r'!\s*important', css, re.I)))
    # ID selectors: '#name' occurring in a selector position (before a '{', not inside a declaration)
    ids = set()
    for sel in re.findall(r'(?:^|[{}])\s*([^{}@;]+)\{', css):
        for m in re.finditer(r'#([A-Za-z_][\w-]*)', sel):
            ids.add(m.group(1))
    print('  ID selectors:', sorted(ids))
    print('  rules reading var(--itchio_link_color):', len(re.findall(r'\{[^{}]*var\(--itchio_link_color', css)))
    m = re.search(r'([^{}]*\.collection_row h2 a[^{}]*)\{([^{}]*)\}', css)
    if m:
        print('  collection h2 a rule:', m.group(1).strip()[:90], '=>', m.group(2).strip()[:80])
    m = re.search(r'([^{}]*\.button:focus[^{}]*)\{([^{}]*)\}', css)
    if m:
        print('  .button:focus rule:', m.group(1).strip()[:90], '=>', m.group(2).strip()[:80])
    m = re.search(r'(^|[}])\s*(:focus)\s*\{([^{}]*)\}', css)
    if m:
        print('  :focus rule =>', m.group(3).strip()[:90])

for f in ('bundle.min.js', 'user.min.js', 'jam.min.js'):
    js = open(os.path.join(d, f), encoding='utf-8', errors='replace').read()
    print(f'== {f}: {len(js)} chars')
    for pat in (r'itchio-grid-sizer', r'grid-template-columns', r'appendTo\(\w+\("head"\)\)', r'container_selector',
                r'\.mode_grid \.user_game_grid', r'game_grid_widget\.game_list', r'browse_game_grid', r'new \w+\.GameGrid'):
        hits = [m.start() for m in re.finditer(pat, js)]
        ctx = js[hits[0]-60:hits[0]+90].replace('\n', ' ') if hits else ''
        print(f'  {pat}: {len(hits)}', ('  ctx: ' + ctx) if hits and f != 'jam.min.js' or hits and 'GameGrid' in pat else '')
