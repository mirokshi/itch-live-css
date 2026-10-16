import sys, re, os, json, collections
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cssparse import parse, strip_comments, specificity, split_selectors

def load(path):
    return strip_comments(open(path, encoding='utf8', errors='replace').read())

def summary(path, key_patterns=None):
    css = load(path)
    rules = parse(css)
    res = {}
    style = [r for r in rules if r.get('sel')]
    at = [r for r in rules if not r.get('sel')]
    res['n_style_rules'] = len(style)
    res['nested_rules'] = sum(1 for r in style if r.get('nested'))
    media = collections.Counter()
    for r in style:
        for c in r['ctx']:
            media[c] += 1
    res['media'] = media.most_common()
    res['fontface'] = collections.Counter()
    res['keyframes'] = []
    res['other_at'] = collections.Counter()
    for r in at:
        a = r['atrule']
        if a.lower().startswith('@font-face'):
            fam = [v for p, v, i in r['decls'] if p == 'font-family']
            w = [v for p, v, i in r['decls'] if p == 'font-weight']
            st = [v for p, v, i in r['decls'] if p == 'font-style']
            res['fontface'][(fam[0] if fam else '?', w[0] if w else '', st[0] if st else '')] += 1
        elif 'keyframes' in a.lower():
            res['keyframes'].append(a.split()[-1])
        else:
            res['other_at'][a.split()[0]] += 1
    defined = collections.Counter(); consumed = collections.Counter()
    imp = []
    zidx = []
    focus = []
    trans = []
    for r in style:
        for p, v, i in r['decls']:
            if p.startswith('--'):
                defined[p] += 1
            for m in re.findall(r'var\((--[\w-]+)', v):
                consumed[m] += 1
            if i:
                imp.append((r['sel'], p, v, ' / '.join(r['ctx'])))
            if p == 'z-index':
                zidx.append((v, r['sel'], ' / '.join(r['ctx'])))
            if p in ('transition', 'animation', 'animation-name', 'transition-property'):
                trans.append((r['sel'], p, v, ' / '.join(r['ctx'])))
        if re.search(r':focus|:focus-visible|:focus-within', r['sel']):
            focus.append((r['sel'], r['decls'], ' / '.join(r['ctx'])))
    res['vars_defined'] = defined.most_common()
    res['vars_consumed'] = consumed.most_common()
    res['important'] = imp
    res['zindex'] = zidx
    res['focus'] = focus
    res['transitions'] = trans
    res['rules'] = style
    return res

if __name__ == '__main__':
    path = sys.argv[1]
    s = summary(path)
    print('FILE', path)
    print('style rules', s['n_style_rules'], 'nested', s['nested_rules'])
    print('MEDIA/at contexts:')
    for m, c in s['media']: print('  ', c, m)
    print('FONT-FACE:')
    for k, c in s['fontface'].items(): print('  ', c, k)
    print('KEYFRAMES:', s['keyframes'])
    print('OTHER AT:', dict(s['other_at']))
    print('VARS DEFINED:', s['vars_defined'])
    print('VARS CONSUMED:', s['vars_consumed'])
    print('IMPORTANT count', len(s['important']))
    print('ZINDEX count', len(s['zindex']))
    print('FOCUS count', len(s['focus']))
    print('TRANS count', len(s['transitions']))
