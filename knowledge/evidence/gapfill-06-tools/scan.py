"""Gap-fill 06 (2026-10-14): which modern CSS constructs appear in custom CSS as itch SERVES it.

For each saved itch page (raw HTML), extract the user's custom CSS exactly as served
(style#custom_css, or the tail of style#jam_theme after the generated
`.view_jam_page .jam_filter_picker .divider{…}` rule), strip comments, blank out string and
url() contents, then count constructs. Pages are de-duplicated by canonical URL (newest file wins).

usage: python -I scan.py <label>=<glob-or-dir> [...]   (prints per-group tables + per-page TSV to stdout)
"""
import re, sys, os, glob, collections

DIVIDER = b'.view_jam_page .jam_filter_picker .divider{'
AT = ['import', 'media', 'supports', 'font-face', 'keyframes', 'property', 'layer', 'scope',
      'container', 'starting-style', 'view-transition', 'charset', 'namespace', 'counter-style',
      'position-try', 'function', 'font-feature-values', 'page']


def custom_css(d):
    m = re.search(rb'<style\b[^>]*\bid="custom_css"[^>]*>(.*?)</style>', d, re.S)
    if m:
        return m.group(1)
    m = re.search(rb'<style\b[^>]*\bid="jam_theme"[^>]*>(.*?)</style>', d, re.S)
    if m:
        t = m.group(1); k = t.find(DIVIDER)
        if k >= 0:
            return t[t.index(b'}', k) + 1:]
    return None


def canon(d):
    """Stable page key (itch pages carry no canonical link): <body data-page_name> +
    itch:path meta (+ og:title except on profiles), e.g. 'user|users/1608728|', 'view_jam||GBJAM 15'."""
    g = lambda m: m.group(1).decode('utf-8', 'replace') if m else ''
    pn = re.search(rb'<body\b[^>]*data-page_name="([^"]+)"', d)
    if not pn:
        return None
    ip = re.search(rb'<meta\b[^>]*content="([^"]+)"[^>]*name="itch:path"', d)
    ti = re.search(rb'<meta\b[^>]*content="([^"]*)"[^>]*property="og:title"', d) or \
        re.search(rb'<meta\b[^>]*property="og:title"[^>]*content="([^"]*)"', d)
    key = g(pn) + '|' + g(ip) + '|'
    return key if g(pn) == 'user' else key + g(ti)


def ptype(key):
    pn = key.split('|')[0]
    return {'user': 'profile', 'view_game': 'project', 'view_jam': 'jam'}.get(
        pn, 'devlog' if 'devlog' in pn else 'other')


def clean(css):
    css = re.sub(r'/\*.*?\*/', ' ', css, flags=re.S)
    keep = css  # comment-free, strings intact (for @property syntax check)
    css = re.sub(r'url\(\s*(["\']?).*?\1\s*\)', 'url(U)', css, flags=re.S)
    css = re.sub(r'"(?:\\.|[^"\\])*"', '"S"', css)
    css = re.sub(r"'(?:\\.|[^'\\])*'", "'S'", css)
    return keep, css


def nested_rules(css):
    stack, pre, n = [], [], 0
    for ch in css:
        if ch == '{':
            p = ''.join(pre).strip(); pre = []
            if p.startswith('@'):
                stack.append(('at', p[1:].split('(')[0].split()[0].lower() if len(p) > 1 else ''))
            elif stack and stack[-1][0] == 'at' and stack[-1][1].endswith('keyframes'):
                stack.append(('kf', ''))
            else:
                if any(s[0] == 'style' for s in stack):
                    n += 1
                stack.append(('style', ''))
        elif ch == '}':
            if stack: stack.pop()
            pre = []
        elif ch == ';':
            pre = []
        else:
            pre.append(ch)
    return n


def analyze(raw):
    css = raw.decode('utf-8', 'replace')
    keep, c = clean(css)
    r = {'len': len(css)}
    r['amp'] = c.count('&')
    r['nested'] = nested_rules(c)
    for a in AT:
        r['@' + a] = len(re.findall(r'@' + re.escape(a) + r'(?![\w-])', c, flags=re.I))
    r['prop_lt'] = len(re.findall(r'@property[^{]*\{[^}]*syntax\s*:\s*["\']\s*<', keep, flags=re.I))
    r['range_mq'] = len(re.findall(r'@media[^{;]*\([^)]*[<>]', c, flags=re.I))
    r[':has'] = len(re.findall(r':has\(', c))
    r[':is/:where'] = len(re.findall(r':(?:is|where)\(', c))
    return r


def main():
    groups = collections.OrderedDict()
    for arg in sys.argv[1:]:
        label, pat = arg.split('=', 1)
        files = sorted(glob.glob(os.path.join(pat, '*.html')) if os.path.isdir(pat) else glob.glob(pat))
        groups[label] = files
    union = {}
    for label, files in groups.items():
        pages = {}
        for f in files:
            d = open(f, 'rb').read()
            cs = custom_css(d)
            u = canon(d)
            if cs is None or not cs.strip() or not u:
                continue
            if u in pages and os.path.getmtime(pages[u][0]) >= os.path.getmtime(f):
                continue
            pages[u] = (f, analyze(cs))
        report(label, pages)
        for u, v in pages.items():
            if u not in union or os.path.getmtime(union[u][0]) < os.path.getmtime(v[0]):
                union[u] = v
    report('UNION (dedup by canonical URL)', union)


KEYS = ['amp', 'nested', '@property', 'prop_lt', '@layer', '@scope', '@container', '@starting-style',
        '@view-transition', '@supports', 'range_mq', ':has', ':is/:where', '@import', '@charset',
        '@namespace', '@counter-style', '@position-try', '@function', '@font-feature-values', '@page']


def report(label, pages):
    by = collections.Counter(ptype(u) for u in pages)
    print(f'\n## {label}: {len(pages)} pages with custom CSS  ' + ', '.join(f'{k} {v}' for k, v in sorted(by.items())))
    print('| construct | pages | occurrences | profile | project | devlog | jam |')
    print('|---|---:|---:|---:|---:|---:|---:|')
    for k in KEYS:
        hit = [(u, v[1][k]) for u, v in pages.items() if v[1][k]]
        t = collections.Counter(ptype(u) for u, _ in hit)
        print(f'| `{k}` | {len(hit)} | {sum(x for _, x in hit)} | {t["profile"]} | {t["project"]} | {t["devlog"]} | {t["jam"]} |')
    for k in ['amp', 'nested', '@property', '@layer', '@scope', '@container', '@starting-style', '@view-transition', 'range_mq']:
        hit = sorted(((v[1][k], u) for u, v in pages.items() if v[1][k]), reverse=True)
        if hit:
            print(f'  top {k}: ' + '; '.join(f'{n}×{ptype(u)}' for n, u in hit[:6]))
    if os.environ.get('TSV'):
        for u, v in sorted(pages.items()):
            print('TSV', ptype(u), u, os.path.basename(v[0]), *(f'{k}={v[1][k]}' for k in KEYS if v[1][k]), sep='\t')


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    main()
