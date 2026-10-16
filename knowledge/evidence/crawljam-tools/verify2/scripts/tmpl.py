# usage: python -I tmpl.py <overview html...> -> template stats of the generated part of style#jam_theme
import re, sys, os, collections
DIV = re.compile(r'\.view_jam_page \.jam_filter_picker \.divider\{[^}]*\}')
seqs = collections.Counter(); vals = collections.defaultdict(collections.Counter); lens = []
rows = []
def rgb(h):
    h = h.strip().lstrip('#')
    if len(h) == 3: h = ''.join(c * 2 for c in h)
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))
for p in sys.argv[1:]:
    h = open(p, encoding='utf8', errors='replace').read()
    m = re.search(r'<style[^>]*id="jam_theme"[^>]*>(.*?)</style>', h, re.S)
    if not m: continue
    t = m.group(1); ms = list(DIV.finditer(t))
    if not ms: print('NO DIVIDER', p); continue
    g = t[:ms[-1].end()]; lens.append(len(g))
    rules = re.findall(r'([^{}]+)\{([^{}]*)\}', g)
    seq = tuple(re.sub(r'\s+', ' ', s.strip()) for s, _ in rules)
    seqs[seq] += 1
    d = {s.strip(): b for s, b in rules}
    w = dict((k.strip(), v.strip()) for k, v in re.findall(r'([\w-]+)\s*:\s*([^;]+)', d['.jam_page_wrap']))
    for k in ['font-size', '--itchio_border_radius', 'background-repeat', 'background-position', 'background-size', 'background-attachment']:
        vals[k][w.get(k, '(absent)')] += 1
    vals['has_bg_image']['background-image' in w] += 1
    vals['font-family'][w['font-family']] += 1
    vals['border==shadow'][w['--itchio_button_border_color'].lower() == w['--itchio_button_shadow_color'].lower()] += 1
    vals['link==button'][w['--itchio_link_color'].lower() == w['--itchio_button_color'].lower()] += 1
    pan = d.get('.view_jam_page .jam_body,.view_jam_page .grid_outer', '')
    a = re.search(r'rgba\(([^)]*)\)', pan); vals['panel_alpha'][a.group(1).split(',')[-1].strip() if a else pan] += 1
    vals['box-shadow'][re.sub(r'#[0-9a-fA-F]{3,6}|rgba\([^)]*\)', 'C', d.get('.view_jam_page .jam_body', ''))] += 1
    hd = [b for s, b in rules if s.startswith('.view_jam_page h1')]
    vals['heading_rule'][re.sub(r"'[^']*'|#[0-9a-fA-F]+", 'X', hd[0]) if hd else '(none)'] += 1
    vals['n_important'][g.count('!important')] += 1
    B = rgb(w['--itchio_button_color'])
    for k in ['shadow', 'hover', 'active']:
        c = rgb(w['--itchio_button_%s_color' % k])
        diffs = tuple(c[i] - B[i] for i in range(3))
        vals['off_' + k][diffs if len(set(diffs)) > 1 else diffs[0]] += 1
    rows.append((os.path.basename(p), len(g), w.get('background-repeat'), w.get('background-size'), w.get('background-attachment')))
print('generated part length range:', min(lens), max(lens), 'n=', len(lens))
print('distinct selector sequences:', len(seqs))
for s, n in seqs.items():
    print(n, 'x', len(s), 'rules:'); [print('   ', x) for x in s]
for k, c in vals.items():
    print(k, dict(c))
