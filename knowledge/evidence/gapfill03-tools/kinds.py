"""Group project main pages (data-page_name=view_game, with #wrapper) by classification, read from the footer
breadcrumbs (first itch.io/<kind> link), and print the structural signature of each page:
#inner_column children, page-widget extra classes, page-widget children before .columns, .left_col block classes.
Dedupes by project URL (og:url / canonical / first devlog link); keeps the newest file.
usage: python -I kinds.py "<glob>" [...]      prints numbers and class names only, never page text."""
import sys, glob, re, os, collections
from html.parser import HTMLParser
VOID = {'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}

class Node:
    def __init__(s, tag, attrs, parent): s.tag, s.a, s.parent, s.kids = tag, dict(attrs), parent, []
    def cls(s): return (s.a.get('class') or '').split()

class P(HTMLParser):
    def __init__(s):
        super().__init__(convert_charrefs=True); s.root = Node('#', [], None); s.cur = s.root
    def handle_starttag(s, t, a):
        n = Node(t, a, s.cur); s.cur.kids.append(n)
        if t not in VOID: s.cur = n
    def handle_startendtag(s, t, a): s.cur.kids.append(Node(t, a, s.cur))
    def handle_endtag(s, t):
        c = s.cur
        while c is not None and c.tag != t: c = c.parent
        if c is not None and c.parent is not None: s.cur = c.parent

def find(n, pred):
    if pred(n): return n
    for k in n.kids:
        r = find(k, pred)
        if r: return r

def lab(n):
    i = n.a.get('id'); s = n.tag
    if i: s += '#' + re.sub(r'\d+', 'N', i)
    c = [x for x in n.cls() if x not in ('base_widget', 'page_widget')]
    return s + ('.' + '.'.join(c) if c else '')

pages = {}
for g in sys.argv[1:]:
    for f in glob.glob(g):
        t = open(f, encoding='utf-8', errors='replace').read()
        b = re.search(r'<body[^>]*>', t)
        if not b or 'data-page_name="view_game"' not in b.group(0) or 'id="wrapper"' not in t: continue
        m = re.search(r'<meta[^>]*property="og:url"[^>]*content="([^"]+)"', t) or \
            re.search(r'<link[^>]*href="([^"]+)"[^>]*rel="canonical"', t) or \
            re.search(r'<link[^>]*rel="canonical"[^>]*href="([^"]+)"', t)
        url = m.group(1) if m else os.path.basename(f)
        mt = os.path.getmtime(f)
        if url in pages and pages[url][0] >= mt: continue
        pages[url] = (mt, f, t)

sig = collections.defaultdict(list)
for url, (mt, f, t) in sorted(pages.items()):
    p = P(); p.feed(t)
    bc = find(p.root, lambda n: 'breadcrumbs' in n.cls() and n.tag == 'div')
    kind = '?'
    if bc:
        for a in bc.kids:
            h = a.a.get('href') or ''
            mm = re.match(r'https://itch\.io/([a-z-]+)', h)
            if mm: kind = mm.group(1); break
    ic = find(p.root, lambda n: n.a.get('id') == 'inner_column')
    pw = find(p.root, lambda n: 'view_game_page' in n.cls())
    if not ic or not pw: continue
    top = []
    for k in pw.kids:
        if 'columns' in k.cls(): break
        top.append('.' + (k.cls()[0] if k.cls() else k.tag))
    lc = find(pw, lambda n: 'left_col' in n.cls())
    blocks = tuple(sorted({(k.cls() or [k.tag])[0] for k in lc.kids})) if lc else ()
    hdr = find(ic, lambda n: n.a.get('id') == 'header')
    flags = '.'.join(c for c in pw.cls() if c in ('buy_on_top', 'direct_download', 'view_html_game_page'))
    sig[kind].append((url.split('//')[-1][:45], flags or '-', ' > '.join(top + ['.columns']),
                      'banner' if hdr and 'has_image' in hdr.cls() else 'no-banner',
                      ' + '.join(lab(k) for k in ic.kids if k.tag != 'script')))

for kind in sorted(sig):
    rows = sig[kind]
    print(f'== {kind}: {len(rows)} pages')
    c = collections.Counter((r[1], r[2]) for r in rows)
    for (fl, top), n in c.most_common(): print(f'   {n:3d}  flags={fl:42s} top={top}')
    ics = collections.Counter(re.sub(r'\.size_\w+|\.family_[\w-]+', '', r[4]) for r in rows)
    for s_, n in ics.items(): print(f'   inner_column children ({n}): {s_}')
