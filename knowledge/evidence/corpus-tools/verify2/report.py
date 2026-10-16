import sys, re, statistics, os
from collections import Counter, defaultdict
here = os.path.dirname(os.path.abspath(sys.argv[0]))
g = {'__name__': 'stats'}
exec(open(os.path.join(here, 'stats.py'), encoding='utf-8').read(), g)
sys.argv = [sys.argv[0], sys.argv[1], sys.argv[2]]
P = g['main']()
K = ['profile', 'project', 'jam']
def by(k): return [p for p in P if p['kind'] == k]
def pct(xs, q):
    xs = sorted(xs);
    # nearest-rank and linear both
    import math
    lin = statistics.quantiles(xs, n=10, method='inclusive')[8] if len(xs) > 1 else xs[0]
    return round(lin)
print('== lengths')
for k in K + ['all']:
    xs = by(k) if k != 'all' else P
    c = [p['c'] for p in xs]; b = [p['b'] for p in xs]
    print(k, len(xs), 'chars min', min(c), 'med', statistics.median(c), 'p90', pct(c, .9), 'max', max(c), '| bytes med', statistics.median(b), 'max', max(b), '| >5120 chars', sum(x > 5120 for x in c), '>5120 bytes', sum(x > 5120 for x in b))
pr = sorted(by('profile'), key=lambda p: -p['c'])
print('top profiles', [(p['url'].split('//')[1][:30], p['c'], p['b'], p['lf'], p['crlf']) for p in pr[:6]])
print('profiles within 400 of 5120:', sum(5120 - p['c'] <= 400 for p in by('profile')))
pj = sorted(by('jam'), key=lambda p: -p['c'])
print('top jams', [(p['url'].split('/')[-1], p['c']) for p in pj[:5]])
print('jam min', min(p['c'] for p in by('jam')), [p['url'] for p in by('jam') if p['c'] == min(q['c'] for q in by('jam'))])
print('== escaping')
print('entities', sum(p['entities'] for p in P), '| gt_code', sum(p['gt_code'] for p in P), 'pages', sum(p['gt_code'] > 0 for p in P), '| lt', sum(p['lt_raw'] for p in P), 'pages', sum(p['lt_raw'] > 0 for p in P), '| amp', sum(p['amp_raw'] for p in P), 'pages', sum(p['amp_raw'] > 0 for p in P))
print('== newlines (multi-line pages)')
for k in K:
    ml = [p for p in by(k) if p['crlf'] + p['lf'] > 0]
    print(k, 'multi', len(ml), 'crlf-only', sum(p['crlf'] > 0 and p['lf'] == 0 for p in ml), 'lf-only', sum(p['lf'] > 0 and p['crlf'] == 0 for p in ml), 'mixed', sum(p['lf'] > 0 and p['crlf'] > 0 for p in ml), 'no-newline', len(by(k)) - len(ml))
    if k == 'jam': print('   crlf jams', [p['url'] for p in ml if p['crlf']])
print('== whitespace edges (profile+project)')
pp = by('profile') + by('project')
print('lead_ws', sum(p['lead_ws'] for p in pp), 'trail_ws', sum(p['trail_ws'] for p in pp), 'of', len(pp))
print('jam tails end with exactly one space:', sum(p['s'].endswith(' ') and not p['s'][:-1].endswith(' ') and not p['s'][:-1][-1:].isspace() for p in by('jam')), 'of', len(by('jam')), '; end with "} ":', sum(p['s'].endswith('} ') for p in by('jam')))
print('== comments')
for k in K + ['all']:
    xs = by(k) if k != 'all' else P
    print(k, 'pages w/comments', sum(p['comments'] > 0 for p in xs), 'comments', sum(p['comments'] for p in xs), 'share %.1f%%' % (100 * sum(p['comment_bytes'] for p in xs) / sum(p['b'] for p in xs)), 'single-line', sum(p['single_line'] for p in xs))
print('median ws ratio %.3f' % statistics.median(p['ws'] for p in P))
print('== important')
for k in K + ['all']:
    xs = by(k) if k != 'all' else P
    print(k, 'pages(all text)', sum(p['important_all'] > 0 for p in xs), 'count', sum(p['important_all'] for p in xs), '| pages(code)', sum(p['important_code'] > 0 for p in xs), 'count', sum(p['important_code'] for p in xs))
print('== non-ascii')
na = [p for p in P if p['nonascii']]
print('pages', len(na), 'fffd', sum(p['fffd'] for p in P), 'bom', sum(p['bom'] for p in P), 'nbsp', sum(p['nbsp'] for p in P))
allna = Counter()
for p in na: allna.update(p['nonascii'])
print('chars', ''.join(sorted(allna)))
print('cjk ideographs', [c for c in allna if 0x4e00 <= ord(c) <= 0x9fff], 'astral', [(p['url'], p['astral'][:3]) for p in P if p['astral']])
print('== escapes', sum(p['escapes'] for p in P), 'pages', sum(p['escapes'] > 0 for p in P), [(p['url'], p['escapes']) for p in P if p['escapes']])
print('== imports')
hosts = Counter(); hosts_pages = defaultdict(set)
for p in P:
    for u in p['imports']:
        h = re.sub(r'^https?://', '', u).split('/')[0]; hosts_pages[h].add(p['url'])
print('pages with @import', sum(bool(p['imports']) for p in P), 'by kind', Counter(p['kind'] for p in P if p['imports']))
print({h: len(v) for h, v in hosts_pages.items()})
print('pages with @import only in code (not comment):', sum(bool(p['imports_code']) for p in P))
for p in P:
    if p['imports'] and p['kind'] != 'jam':
        if p['import_before']: print('  import NOT first:', p['url'], repr(p['import_before'][:80]))
print('jam imports', [p['url'] for p in by('jam') if p['imports']])
print('== font-face', sum(p['fontface'] for p in P), 'pages', sum(p['fontface'] > 0 for p in P), Counter(p['kind'] for p in P if p['fontface']))
fh = Counter(re.sub(r'^https?://', '', u).split('/')[0] for p in P for u in p['ffsrc'])
print('ff src hosts', fh)
print('ff per page', [(p['url'], p['fontface']) for p in P if p['fontface']])
print('== url hosts (pages, all text / code only)')
uh = defaultdict(set); uhc = defaultdict(set)
for p in P:
    for u in p['urls']:
        if u.startswith('data:'): continue
        h = re.sub(r'^https?://', '', u).split('/')[0] if u.startswith('http') else ('REL:' + u[:20])
        uh[h].add(p['url'])
    for u in p['urls_code']:
        if u.startswith('data:'): continue
        h = re.sub(r'^https?://', '', u).split('/')[0] if u.startswith('http') else ('REL:' + u[:20])
        uhc[h].add(p['url'])
print(sorted(((len(v), h, len(uhc.get(h, ()))) for h, v in uh.items()), reverse=True))
print('http:// urls', [(p['url'], u) for p in P for u in p['urls'] if u.startswith('http://')])
print('== data uris', sum(len(p['data_uris']) for p in P), 'pages', sum(bool(p['data_uris']) for p in P), Counter(x.strip() for p in P for x in p['data_uris']), 'by kind', Counter(p['kind'] for p in P if p['data_uris']))
dl = [l for p in P for l in p['data_lens']]
print('data lens', sorted(dl))
print('== selectors')
allsel = sum(len(p['sels']) for p in P); uns = sum(len(p['unscoped']) for p in P)
print('top-level selectors', allsel, 'without #wrapper', uns, '%.1f%%' % (100 * uns / allsel))
print('pages with unscoped', sum(bool(p['unscoped']) for p in P), 'pages fully scoped', sum(bool(p['sels']) and not p['unscoped'] for p in P), 'pages mentioning #wrapper', sum('#wrapper' in p['code'] for p in P))
print('root/html/body pages', sum(bool(p['rootish']) for p in P), Counter(p['kind'] for p in P if p['rootish']))
print('header pages', sum(bool(p['header']) for p in P), 'user_tools pages', sum(bool(p['usertools']) for p in P))
print('== footer')
for p in P:
    for t, pre, body, ctx in p['blocks']:
        if t == 'rule' and re.search(r'\.footer\b', pre):
            hide = re.search(r'display\s*:\s*none|visibility\s*:\s*hidden|opacity\s*:\s*0(?![.\d])|(?<![-\w])height\s*:\s*0(?![.\d])', body)
            print('  ', p['kind'], p['url'].split('//')[1][:40], '|', pre[:50].replace('\n', ' '), '| hide:', bool(hide), '|', re.sub(r'\s+', ' ', body)[:90])
print('pages with .footer rule', sum(any(t == 'rule' and re.search(r'\.footer\b', pre) for t, pre, body, ctx in p['blocks']) for p in P))
print('== features (pages)')
feats = {
 '@import': r'@import', '@font-face': r'@font-face', '@keyframes': r'@(-webkit-)?keyframes', '@media': r'@media', '@supports': r'@supports', '@property': r'@property',
 '@container': r'@container', '@layer': r'@layer', '@scope': r'@scope', '@starting-style': r'@starting-style', '@charset': r'@charset', '@-webkit-keyframes': r'@-webkit-keyframes',
 ':has(': r':has\(', ':is(/:where(': r':(is|where)\(', 'clamp(': r'clamp\(', 'color-mix(': r'color-mix\(', 'calc(': r'calc\(',
 'dvh/svh/lvh': r'\d(dvh|svh|lvh|dvw|svw|lvw)\b', 'prefers-color-scheme': r'prefers-color-scheme', 'prefers-reduced-motion': r'prefers-reduced-motion',
 'animation': r'(?<![-\w])animation(-name)?\s*:', 'transition': r'(?<![-\w])transition(-property)?\s*:', 'backdrop-filter': r'backdrop-filter',
 'range media': r'\((width|height)\s*[<>]=?', '--itchio_': r'--itchio_',
}
for name, rx in feats.items():
    pages = [p for p in P if re.search(rx, p['code'])]
    print(f'{name:22}', len(pages), dict(Counter(p['kind'] for p in pages)))
print('nesting pages', sum(p['nested'] > 0 for p in P), 'nested rules', sum(p['nested'] for p in P), Counter(p['kind'] for p in P if p['nested']), '&> count', sum(p['nest_gt'] for p in P))
print('== itchio vars')
iv = defaultdict(set)
for p in P:
    for v in re.findall(r'--itchio_[\w-]+', p['code']): iv[v].add(p['url'])
print(sorted(((len(v), k) for k, v in iv.items()), reverse=True))
print('itchio pages', sum(bool(re.search(r'--itchio_', p['code'])) for p in P), Counter(p['kind'] for p in P if re.search(r'--itchio_', p['code'])))
print('== selector tokens')
for k in K:
    tok = defaultdict(set)
    for p in by(k):
        for sel in p['sels']:
            for t in set(re.findall(r'[.#][A-Za-z_][\w-]*', sel)):
                if t.startswith('.custom'): continue
                tok[t].add(p['url'])
    print(k, sorted(((len(v), t) for t, v in tok.items()), reverse=True)[:24])
