# Inventory of style#game_theme across pages: selector-set signatures, variables, background, alphas, headings.
# Prints only counts and normalized (value-free) selector names.
import sys, os, re, collections
sys.path.insert(0, os.path.dirname(__file__))
from tree import load, byid
from flat import flatten
C = collections.Counter
cnt = collections.defaultdict(C)
sigs = C()
first_sel = None


def spec(sel):
    s = re.sub(r'::?[a-z-]+(\([^)]*\))?', lambda m: ' .PSEUDO' if m.group(0).startswith(':') and not m.group(0).startswith('::') else ' ', sel)
    ids = len(re.findall(r'#[\w-]+', sel))
    cls = len(re.findall(r'\.[\w-]+', sel)) + len(re.findall(r'\[[^\]]+\]', sel)) + len(re.findall(r'(?<!:):(?!:)[\w-]+', sel))
    tags = len(re.findall(r'(?:^|[\s>+~,(])([a-zA-Z][\w-]*)', sel))
    return (ids, cls, tags)


n = 0
for path in sys.argv[1:]:
    r = load(path)
    t = byid(r, 'game_theme')
    if not t:
        continue
    n += 1
    raw = t.text
    rows = flatten(raw)
    sels = tuple(s for m, s, b in rows)
    sigs[sels] += 1
    cnt['n_groups'][len(rows)] += 1
    for m, s, b in rows:
        for part in s.split(','):
            sp = spec(part.strip())
            cnt['max_spec'][sp] += 0
        if '#' in s:
            cnt['id_in_theme'][s[:60]] += 1
        if '!important' in b:
            cnt['important_sel'][s[:90]] += 1
        props = [d.split(':', 1)[0].strip() for d in b.split(';') if ':' in d]
        if s.strip() == ':root':
            cnt['root_vars'][' '.join(sorted(p for p in props))] += 1
        if s.strip() == '.wrapper':
            cnt['wrapper_vars'][' '.join(sorted(p for p in props if p.startswith('--')))] += 1
            cnt['wrapper_nonvar_props'][' '.join(sorted(set(p for p in props if not p.startswith('--'))))] += 1
            for d in b.split(';'):
                if ':' not in d:
                    continue
                k, v = [x.strip() for x in d.split(':', 1)]
                if k == 'background-repeat':
                    cnt['bg_repeat'][v] += 1
                if k == 'background-position':
                    cnt['bg_position'][v] += 1
                if k == 'background-attachment':
                    cnt['bg_attach'][v] += 1
                if k == 'background-image':
                    cnt['bg_image_host'][re.sub(r'^url\(["\']?(https?://[^/]+)/.*', r'\1', v)[:40]] += 1
            # are background longhands between /*! */ and /* */ markers?
            m = re.search(r'\.wrapper\s*\{(.*?)\}', raw, re.S)
            if m and 'background-image' in m.group(1):
                cnt['bg_in_markers'][bool(re.search(r'/\*!\s*\*/[^}]*background-image[^}]*/\*\s*\*/', m.group(1), re.S))] += 1
        if s.strip() == '.inner_column':
            for d in b.split(';'):
                if d.strip().startswith('background-color'):
                    v = d.split(':', 1)[1].strip()
                    a = re.match(r'rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*([\d.]+)\s*\)', v)
                    cnt['inner_bg_alpha'][a.group(1) if a else ('hex/other:' + v[:1])] += 1
                if d.strip().startswith('font-family'):
                    cnt['inner_font_tail'][re.sub(r'^[^,]*,', 'X,', d.split(':', 1)[1].strip())] += 1
            cnt['inner_props'][' '.join(sorted(set(props)))] += 1
        if re.match(r'\s*\.inner_column h1\s*,', s):
            cnt['headings_sel'][re.sub(r'\s+', ' ', s)] += 1
            for d in b.split(';'):
                if ':' in d:
                    k, v = [x.strip() for x in d.split(':', 1)]
                    if k == 'color':
                        cnt['headings_color'][v if v == 'inherit' else 'hex'] += 1
                    if k == 'font-weight':
                        cnt['headings_weight'][v] += 1
                    if k == 'font-family':
                        cnt['headings_family'][v if v == 'inherit' else 'set'] += 1
        if s.strip() == '.game_frame':
            cnt['game_frame_props'][' '.join(sorted(set(props)))] += 1
            cnt['game_frame_bgimg'][('background-image' in b)] += 1
        if '.right_col' in s:
            cnt['right_col_rule'][s.strip() + ' -> ' + b.strip()] += 1
        if re.search(r'(^|,)\s*\.inner_column a\b', s):
            cnt['link_rule_sel'][re.sub(r'\s+', ' ', s)] += 1
            cnt['link_rule_val_is_var'][('var(' in b)] += 1
        if re.search(r'\.inner_column \.button\s*($|,)', s):
            cnt['button_rule_sel'][re.sub(r'\s+', ' ', s)] += 1
            cnt['button_rule_is_var'][('var(' in b)] += 1
    allsp = []
    for m, s, b in rows:
        for part in s.split(','):
            allsp.append((spec(part.strip()), part.strip()))
    mx = max(allsp)
    cnt['max_specificity'][str(mx[0])] += 1
    cnt['n_var_uses'][len(re.findall(r'var\(', raw))] += 1
print('pages with theme', n, 'distinct selector-sequence signatures', len(sigs))
for k, v in cnt.items():
    print('##', k)
    for a, b in v.most_common(30):
        print(f'  {b:3d}  {a}')
if len(sigs) > 1:
    base = set(sigs.most_common(1)[0][0])
    for s, c in sigs.items():
        print('sig', c, 'extra', set(s) - base, 'missing', base - set(s))
