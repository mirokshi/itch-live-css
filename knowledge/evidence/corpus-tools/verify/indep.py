# Independent re-analysis of raw itch pages. usage: python -I indep.py <rawdir> > out.txt
import sys, re, os, glob, statistics as S
from collections import Counter, defaultdict
sys.stdout.reconfigure(encoding='utf-8')
raw = sys.argv[1]
DIV = b'.view_jam_page .jam_filter_picker .divider{'
rows = []
jaminfo = []
for f in sorted(glob.glob(os.path.join(raw, '*.html'))):
    n = os.path.basename(f)
    if n[0] not in 'gpj' or n.startswith('l_'):
        continue
    d = open(f, 'rb').read()
    if b'Just a moment' in d[:3000] or len(d) < 2000:
        continue
    kind = {'g': 'project', 'p': 'profile', 'j': 'jam'}[n[0]]
    css = None
    m = re.search(rb'<style[^>]*\bid="custom_css"[^>]*>(.*?)</style>', d, re.S)
    if m:
        css = m.group(1)
    jt = re.search(rb'<style[^>]*\bid="jam_theme"[^>]*>(.*?)</style>', d, re.S)
    if kind == 'jam':
        if not jt:
            print('NOJAMTHEME', n); continue
        t = jt.group(1); k = t.rfind(DIV)
        if k < 0:
            print('NODIV', n); continue
        e = t.index(b'}', k) + 1
        tail = t[e:]
        jaminfo.append((n, len(t[:e]), t[:22], tail[-2:] if tail else b'', len(tail), tail))
        if m:
            print('JAM WITH custom_css', n)
        if tail.strip() == b'':
            continue
        css = tail
    if css is None:
        continue
    rows.append((kind, n, css, d))

print('pages with css:', Counter(r[0] for r in rows))
print('jam pages', len(jaminfo), 'theme part bytes min/max', min(j[1] for j in jaminfo), max(j[1] for j in jaminfo))
print('jam theme starts', Counter(j[2][:13] for j in jaminfo))
print('jam with css: tail last2', Counter(j[3] for j in jaminfo if j[5].strip()))
print('jam with css: tail ends with exactly one space after non-space', sum(1 for j in jaminfo if j[5].strip() and j[5].endswith(b' ') and not j[5][:-1][-1:].isspace()))
print('jam without css: tails', Counter(j[5] for j in jaminfo if not j[5].strip()))


def strip_comments(s):
    return re.sub(rb'/\*.*?\*/', b'', s, flags=re.S)


def strip_strings(s):
    return re.sub(rb'"[^"\n]*"|\'[^\'\n]*\'', b'""', s)


stats = defaultdict(list)
feat = defaultdict(Counter)
for kind, n, c, d in rows:
    s = c.decode('utf-8')
    stats[kind].append((len(s), len(c), n))
    nc = strip_comments(c)
    ns = strip_strings(nc)
    F = feat[kind]

    def has(k, cond):
        if cond:
            F[k] += 1
    crlf = c.count(b'\r\n'); lf = c.count(b'\n') - crlf
    has('multiline', crlf + lf > 0); has('crlf_only', crlf > 0 and lf == 0); has('lf_only', lf > 0 and crlf == 0); has('mixed', crlf > 0 and lf > 0)
    has('single_line', crlf + lf == 0)
    body = c.rstrip(b' ') if kind == 'jam' else c
    has('lead_ws', body[:1].isspace()); has('trail_ws', body[-1:].isspace())
    ents = re.findall(rb'&(?:gt|lt|amp|quot|apos|#\d+|#x[0-9a-f]+);', c, re.I)
    F['n_entities'] += len(ents)
    F['gt_code'] += ns.count(b'>'); has('gt_page', b'>' in ns)
    F['lt_raw'] += c.count(b'<'); has('lt_page', b'<' in c)
    F['amp_raw'] += c.count(b'&'); has('amp_page', b'&' in c)
    imps = list(re.finditer(rb'@import', nc, re.I))
    has('import', bool(imps))
    if imps:
        before = nc[:imps[0].start()].strip()
        has('import_first', before == b'')
        for im in imps:
            mm = re.match(rb'@import\s+(?:url\()?\s*["\']?(https?://[^/"\')]+)', nc[im.start():], re.I)
            F['imphost:' + (mm.group(1).decode() if mm else '?')] += 1
    has('fontface', b'@font-face' in nc); F['n_fontface'] += nc.count(b'@font-face')
    for fs in re.findall(rb'@font-face\s*\{[^}]*\}', nc):
        for h in re.findall(rb'url\(\s*["\']?https?://([^/"\')]+)', fs):
            F['ffhost:' + h.decode()] += 1
    has('keyframes', re.search(rb'@(-webkit-)?keyframes', nc) is not None)
    has('media', b'@media' in nc)
    for k in [b'@supports', b'@property', b'@container', b'@layer', b'@scope', b'@starting-style', b'@charset', b'@-webkit-keyframes']:
        has(k.decode(), k in nc)
    has(':has(', b':has(' in nc); has(':is/:where', re.search(rb':(is|where)\(', nc) is not None)
    has('important', re.search(rb'!\s*important', nc) is not None); F['n_important'] += len(re.findall(rb'!\s*important', nc))
    has('reduced_motion', b'prefers-reduced-motion' in nc)
    has('animation', re.search(rb'animation(-name)?\s*:', nc) is not None or b'@keyframes' in nc)
    has('transition', re.search(rb'transition\s*:', nc) is not None)
    has('itchio_var', b'--itchio_' in nc)
    for v in set(re.findall(rb'--itchio_[a-z0-9_]+', nc)):
        F['var:' + v.decode()] += 1
    has('dvh', re.search(rb'\d(dvh|svh|lvh)\b', nc) is not None)
    has('prefers-color-scheme', b'prefers-color-scheme' in nc)
    has('clamp', b'clamp(' in nc); has('color-mix', b'color-mix(' in nc)
    has('http_url', re.search(rb'url\(\s*["\']?http://', nc) is not None or re.search(rb'@import\s+["\']http://', nc) is not None)
    has('data_uri', b'data:' in nc); F['n_data'] += len(re.findall(rb'url\(\s*["\']?data:', nc))
    for t in re.findall(rb'url\(\s*["\']?data:([a-z]+/[a-z0-9+.-]+)', nc):
        F['dtype:' + t.decode()] += 1
    has('nonascii', any(ord(ch) > 127 for ch in s)); has('astral', any(ord(ch) > 0xffff for ch in s))
    has('fffd', '�' in s); has('bom', '﻿' in s); has('nbsp', ' ' in s)
    has('hexesc', re.search(rb'\\[0-9a-fA-F]{2,6}', c) is not None); F['n_hexesc'] += len(re.findall(rb'\\[0-9a-fA-F]{2,6}', c))
    has('comments', b'/*' in c); F['n_comments'] += len(re.findall(rb'/\*.*?\*/', c, re.S))
    F['comment_bytes'] += sum(len(x) for x in re.findall(rb'/\*.*?\*/', c, re.S)); F['all_bytes'] += len(c)
    has('wrapper_ref', b'#wrapper' in nc)
    has('root_html_body', re.search(rb'(^|[},;\s])(:root|html|body)\s*[{,:.\[#\s>]', nc) is not None)
    has('nesting', re.search(rb'\{[^{}]*?&[^{}]*?\{', strip_strings(nc)) is not None)
    has('header_widget', re.search(rb'\.(header_widget|primary_header)\b', nc) is not None)
    has('user_tools', re.search(rb'[#.]user_tools\b', nc) is not None)
    for mm in re.finditer(rb'([^{}]*\.footer\b[^{}]*)\{([^{}]*)\}', nc):
        F['footer_rules'] += 1
        if re.search(rb'display\s*:\s*none|visibility\s*:\s*hidden|opacity\s*:\s*0(?![.\d])|(?<![-\w])height\s*:\s*0(?![.\d])', mm.group(2)):
            F['footer_hide_rule'] += 1; print('FOOTERHIDE?', n, mm.group(1)[-80:], mm.group(2)[:160])
    has('footer_any', re.search(rb'\.footer\b', nc) is not None)
    sel_only = re.sub(rb'\{[^{}]*\}', b'{}', re.sub(rb'url\([^)]*\)', b'', ns))
    toks = set(x.decode() for x in re.findall(rb'(?<![\w-])[.#][A-Za-z_][\w-]*', sel_only))
    for t in toks:
        F['T' + t] += 1
    hosts = set(h.decode() for h in re.findall(rb'url\(\s*["\']?https?://([^/"\')]+)', nc))
    hosts |= set(h.decode() for h in re.findall(rb'@import\s+["\']https?://([^/"\']+)', nc))
    for h in hosts:
        F['host:' + h] += 1


def pct(xs, p):
    xs = sorted(xs); k = (len(xs) - 1) * p; f = int(k); c = min(f + 1, len(xs) - 1)
    return xs[f] + (xs[c] - xs[f]) * (k - f)


SKIP = ('T', 'var:', 'host:', 'imphost:', 'dtype:', 'ffhost:')
for kind in ['profile', 'project', 'jam']:
    L = stats[kind]; ch = [x[0] for x in L]; by = [x[1] for x in L]
    print(f'\n## {kind} n={len(L)} chars min={min(ch)} med={S.median(ch)} p90={pct(ch, .9):.0f} max={max(ch)} '
          f'bytes med={S.median(by)} p90={pct(by, .9):.0f} max={max(by)} >5120chars={sum(x > 5120 for x in ch)} >5120bytes={sum(x > 5120 for x in by)}')
    print('  top5', sorted(L)[-5:][::-1])
    F = feat[kind]
    print('  ', {k: v for k, v in sorted(F.items()) if not k.startswith(SKIP)})
    print('   vars', {k: v for k, v in F.items() if k.startswith('var:')})
    print('   imphost', {k: v for k, v in F.items() if k.startswith('imphost:')})
    print('   ffhost', {k: v for k, v in F.items() if k.startswith('ffhost:')})
    print('   hosts', sorted(((v, k) for k, v in F.items() if k.startswith('host:')), reverse=True))
    print('   dtypes', {k: v for k, v in F.items() if k.startswith('dtype:')})
    print('   toks', [(k[1:], v) for k, v in sorted(F.items(), key=lambda kv: -kv[1]) if k.startswith('T')][:32])
tot = Counter()
for F in feat.values():
    tot.update(F)
print('\n## ALL', {k: v for k, v in sorted(tot.items()) if not k.startswith(SKIP)})
print('  vars', sorted(((v, k) for k, v in tot.items() if k.startswith('var:')), reverse=True))
print('  imphost', {k: v for k, v in tot.items() if k.startswith('imphost:')})
print('  ffhost', {k: v for k, v in tot.items() if k.startswith('ffhost:')})
print('  hosts', sorted(((v, k) for k, v in tot.items() if k.startswith('host:')), reverse=True))
print('  dtypes', {k: v for k, v in tot.items() if k.startswith('dtype:')})
