"""Inventory style#game_theme across pages (numbers + selector names only). usage: python -I vtheme.py vcss.py file...
Uses the raw text so that /*! */ markers survive."""
import sys, re, collections, importlib.util
spec = importlib.util.spec_from_file_location('v', sys.argv[1]); v = importlib.util.module_from_spec(spec); spec.loader.exec_module(v)
sets = collections.Counter(); varsets = collections.Counter(); facts = collections.defaultdict(collections.Counter)
n = 0
for f in sys.argv[2:]:
    h = open(f, encoding='utf-8', errors='replace').read()
    m = re.search(r'<style[^>]*id="game_theme"[^>]*>(.*?)</style>', h, re.S)
    if not m: continue
    n += 1; raw = m.group(1)
    facts['has /*! marker'][('/*!' in raw)] += 1
    rows = v.parse(v.strip_comments(raw))
    sels = tuple(s for _, s, _ in rows); sets[sels] += 1
    for _, s, b in rows:
        vs = tuple(sorted(re.findall(r'(--itchio_\w+)\s*:', b)))
        if vs: varsets[(s, vs)] += 1
        props = dict((k.strip(), val.strip()) for k, _, val in (d.partition(':') for d in b.split(';')) if k.strip())
        if s == '.wrapper':
            for k in ('background-image', 'background-repeat', 'background-position', 'background-attachment', 'background-size'):
                facts['.wrapper ' + k][props.get(k, '-') if k != 'background-image' else ('url' if 'url(' in props.get(k, '') else props.get(k, '-'))] += 1
        if s == '.inner_column':
            bg = props.get('background-color', '-'); a = re.findall(r'rgba\([^)]*,\s*([\d.]+)\)', bg)
            facts['.inner_column bg alpha'][a[0] if a else bg[:12]] += 1
            facts['.inner_column keys'][tuple(sorted(props))] += 1
        if s.startswith('.inner_column h1'):
            facts['headings weight'][props.get('font-weight')] += 1
            facts['headings color'][('inherit' if props.get('color') == 'inherit' else 'hex')] += 1
            facts['headings family inherit'][props.get('font-family') == 'inherit'] += 1
        if s == '.view_game_page .right_col': facts['right_col display'][props.get('display')] += 1
        if s == '.game_frame':
            facts['.game_frame keys'][tuple(sorted(props))] += 1
            facts['.game_frame image'][('url(' in b) or ('gradient' in b)] += 1
        if 'important' in b: facts['!important selectors'][s[:80]] += 1
        if '#' in s.replace('#', '', 0) and re.search(r'#[a-zA-Z_]', s): facts['id selectors in theme'][s[:60]] += 1
print('pages with game_theme:', n)
print('distinct selector sets:', len(sets), [ (len(k), c) for k, c in sets.most_common()])
if sets:
    first = sets.most_common(1)[0][0]
    for i, s in enumerate(first): print(f'  {i+1:2d} {s[:150]}')
print('variable groups:')
for (s, vs), c in varsets.most_common(): print(' ', c, s, vs)
for k, cnt in facts.items(): print(k, cnt.most_common(12))
