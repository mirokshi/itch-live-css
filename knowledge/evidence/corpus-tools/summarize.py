import sys, json, statistics, re
from collections import Counter
sys.stdout.reconfigure(encoding='utf-8')
rows = json.load(open(sys.argv[1], encoding='utf-8'))


def pct(vals, p):
    v = sorted(vals)
    if not v: return None
    k = (len(v) - 1) * p; f = int(k); c = min(f + 1, len(v) - 1)
    return round(v[f] + (v[c] - v[f]) * (k - f))


def dist(vals):
    return dict(n=len(vals), min=min(vals), median=round(statistics.median(vals)), p90=pct(vals, .9), max=max(vals))


groups = {'all': rows}
for k in ['profile', 'project', 'jam']:
    groups[k] = [r for r in rows if r['kind'] == k]

print('## Length distributions')
for g, rs in groups.items():
    print(g, 'bytes', dist([r['bytes'] for r in rs]), '| chars', dist([r['chars'] for r in rs]),
          '| chars LF-normalised', dist([r['chars_lf_norm'] for r in rs]))
print('profiles > 5120 chars:', [r['name'] for r in groups['profile'] if r['chars'] > 5120])
print('profiles > 5000 chars:', [(r['name'], r['chars'], r['bytes']) for r in groups['profile'] if r['chars'] > 4800])
print('non-profiles > 5120 chars:', len([r for r in rows if r['kind'] != 'profile' and r['chars'] > 5120]))
for k in ['profile', 'project', 'jam']:
    rs = groups[k]
    if rs: print(k, 'top5 chars', sorted([r['chars'] for r in rs])[-5:])

print('\n## Line endings')
for g in ['profile', 'project', 'jam']:
    rs = groups[g]
    ml = [r for r in rs if r['crlf'] + r['lf_only'] > 0]
    print(g, 'multiline', len(ml), 'CRLF-only', sum(1 for r in ml if r['crlf'] > 0 and r['lf_only'] == 0),
          'LF-only', sum(1 for r in ml if r['lf_only'] > 0 and r['crlf'] == 0), 'mixed', sum(1 for r in ml if r['lf_only'] > 0 and r['crlf'] > 0),
          'single-line', len(rs) - len(ml), '| leading ws pages', sum(1 for r in rs if r['leading_ws']), 'trailing ws pages', sum(1 for r in rs if r['trailing_ws']))


def count(pred, rs=rows):
    return sum(1 for r in rs if pred(r))


def line(label, pred):
    print(f"{label:48} all {count(pred):2}/{len(rows)}  prof {count(pred, groups['profile']):2}/{len(groups['profile'])}  proj {count(pred, groups['project']):2}/{len(groups['project'])}  jam {count(pred, groups['jam']):2}/{len(groups['jam'])}")


print('\n## Feature presence (pages)')
ab = lambda r, n: r['at_blocks'].get(n, 0) + r['at_stmts'].get(n, 0)
line('@import', lambda r: len(r['imports']) > 0)
line('@import placed after a rule (invalid)', lambda r: r['import_after_rule'] or (r['kind'] == 'jam' and len(r['imports']) > 0))
line('@font-face', lambda r: r['font_face'] > 0)
line('@keyframes', lambda r: ab(r, 'keyframes') > 0)
line('@-webkit-keyframes', lambda r: ab(r, '-webkit-keyframes') > 0)
line('@media', lambda r: ab(r, 'media') > 0)
line('@supports', lambda r: ab(r, 'supports') > 0)
line('@container', lambda r: ab(r, 'container') > 0)
line('@layer', lambda r: ab(r, 'layer') > 0)
line('@property', lambda r: ab(r, 'property') > 0)
line('@scope', lambda r: ab(r, 'scope') > 0)
line('@charset', lambda r: ab(r, 'charset') > 0)
line('@starting-style', lambda r: ab(r, 'starting-style') > 0)
line('CSS nesting (rule inside style rule)', lambda r: r['nesting_rules'] > 0)
line(':has()', lambda r: r['pc_has'] > 0)
line(':is()/:where()', lambda r: r['pc_is'] + r['pc_where'] > 0)
line(':not()', lambda r: r['pc_not'] > 0)
line(':hover', lambda r: r['pc_hover'] > 0)
line(':focus-visible/:focus-within', lambda r: r['pc_focus-visible'] + r['pc_focus-within'] > 0)
line('::before/::after', lambda r: r['pseudo_el'] > 0)
line('!important', lambda r: r['important'] > 0)
line('custom properties defined', lambda r: r['custom_props_defined'] > 0)
line('var() used', lambda r: r['var_uses'] > 0)
line('--itchio_* referenced', lambda r: len(r['itchio_vars']) > 0)
line('selector without #wrapper (top-level)', lambda r: r['unscoped_selectors'] > 0)
line('ALL top-level selectors lack #wrapper', lambda r: r['top_selectors'] > 0 and r['unscoped_selectors'] == r['top_selectors'])
line('every top-level selector scoped to #wrapper', lambda r: r['top_selectors'] > 0 and r['unscoped_selectors'] == 0)
line(':root/html/body selector', lambda r: r['sel_root_html_body'] > 0)
line('* universal selector at start', lambda r: r['sel_star'] > 0)
line('bare element selector (img, a, h1...)', lambda r: r['sel_bare_element'] > 0)
line('.custom-* class referenced', lambda r: r['custom_class_refs'] > 0)
line('.customX (no hyphen) class referenced', lambda r: r['custom_noh_refs'] > 0)
line('.footer referenced', lambda r: r['footer_refs'] > 0)
line('data: URI', lambda r: r['data_uris'] > 0)
line('comments present', lambda r: r['comments'] > 0)
line('minified (no newlines or >300 chars/line)', lambda r: r['minified'])
line('non-ASCII characters', lambda r: r['nonascii'] > 0)
line('astral (emoji etc.)', lambda r: r['astral'] > 0)
line('NBSP U+00A0', lambda r: r['nbsp'] > 0)
line('BOM / ZWSP', lambda r: r['bom'] + r['zwsp'] > 0)
line('U+FFFD replacement char', lambda r: r['replacement_char'] > 0)
line('CSS \\hex escapes', lambda r: r['css_escapes'] > 0)
line('HTML entities (&gt; &lt; &amp; &quot; &#)', lambda r: sum(r['html_entities'].values()) > 0)
line("raw '>' in code (combinator)", lambda r: r['code_gt'] > 0)
line("raw '<' anywhere", lambda r: r['raw_lt'] > 0)
line("raw '&' anywhere", lambda r: r['raw_amp'] > 0)
line('-webkit- prefix', lambda r: r['vendor']['-webkit-'] > 0)
line('-moz- prefix', lambda r: r['vendor']['-moz-'] > 0)
line('-ms- prefix', lambda r: r['vendor']['-ms-'] > 0)
line('animation property', lambda r: r['animation_props'] > 0)
line('transition property', lambda r: r['transition_props'] > 0)
line('backdrop-filter', lambda r: r['backdrop_filter'] > 0)
line('prefers-reduced-motion', lambda r: r['reduced_motion'] > 0)
line('prefers-color-scheme', lambda r: r['color_scheme_mq'] > 0)
line('display:none', lambda r: r['display_none'] > 0)
line('http:// (insecure) url()', lambda r: len(r['http_urls']) > 0)
line('clamp()', lambda r: r['modern_fns']['clamp'] > 0)
line('color-mix()', lambda r: r['modern_fns']['color-mix'] > 0)
line('min()/max()', lambda r: r['modern_fns']['min'] + r['modern_fns']['max'] > 0)
line('calc()', lambda r: r['modern_fns']['calc'] > 0)
line('dvh/svh/lvh units', lambda r: r['modern_units']['dvh'] + r['modern_units']['svh'] + r['modern_units']['lvh'] > 0)

print('\n## Totals')
for key in ['important', 'nesting_rules', 'comments', 'code_gt', 'data_uris', 'font_face', 'css_escapes', 'top_selectors', 'unscoped_selectors', 'sel_root_html_body']:
    print(key, sum(r[key] for r in rows))
print('comment bytes share (all pages):', round(sum(r['comment_bytes'] for r in rows) / sum(r['bytes'] for r in rows), 3))
print('whitespace ratio median:', statistics.median(r['ws_ratio'] for r in rows))
print('at-rule block names:', Counter(k for r in rows for k, v in r['at_blocks'].items() for _ in range(v)).most_common())
print('at-rule statement names:', Counter(k for r in rows for k, v in r['at_stmts'].items() for _ in range(v)).most_common())

print('\n## Imports by host')
ih = Counter(); ihp = Counter()
for r in rows:
    hs = set()
    for u in r['imports']:
        m = re.match(r'(?:https?:)?//([^/]+)', u)
        h = m.group(1) if m else ('RELATIVE/OTHER:' + u[:30])
        ih[h] += 1; hs.add(h)
    for h in hs: ihp[h] += 1
print('imports per host (count):', ih.most_common()); print('pages per host:', ihp.most_common())
print('\n## @font-face src schemes/hosts')
fs = Counter()
for r in rows:
    for u in r['font_srcs']:
        m = re.match(r'(https?|data):(?://([^/]+))?', u, re.I)
        fs[(m.group(1).lower() + ':' + (m.group(2) or (u[5:30] if u.lower().startswith('data') else ''))) if m else u[:30]] += 1
print(fs.most_common(20))
print('\n## url() hosts (pages)')
uh = Counter(h for r in rows for h in r['url_hosts'])
print(uh.most_common(30))
print('\n## data: URIs')
d = [(r['name'], b, m) for r in rows for b, m in zip(r['data_uri_bytes'], r['data_mimes'])]
print('count', len(d), 'pages', count(lambda r: r['data_uris'] > 0))
print('sizes', sorted(b for _, b, _ in d)[:5], '...', sorted(b for _, b, _ in d)[-5:])
print('mimes', Counter(m for _, _, m in d).most_common())
print('\n## itchio vars referenced:', Counter(v for r in rows for v in r['itchio_vars']).most_common())
print('\n## unscoped examples (first per page, 25 pages):')
for r in rows[:80]:
    if r['unscoped_examples']: print('  ', r['kind'][:4], r['unscoped_examples'][:3])
print('\n## root/html/body examples:', [x for r in rows for x in r['sel_root_html_body_ex']][:25])
print('\n## non-ASCII samples:', [(r['name'], r['nonascii'], r['nonascii_sample']) for r in rows if r['nonascii']])
print('\n## http urls:', [(r['name'], r['http_urls'][:2]) for r in rows if r['http_urls']])
print('\n## nesting pages:', [(r['name'], r['nesting_rules'], r['amp_nesting']) for r in rows if r['nesting_rules']])
print('\n## :has pages:', [(r['name'], r['pc_has']) for r in rows if r['pc_has']])
print('\n## import pages:', [(r['name'], r['imports'], r['import_after_rule']) for r in rows if r['imports']])
