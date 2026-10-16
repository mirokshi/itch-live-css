# usage: python -I desc2.py <overview html...> -> markup stats inside div.jam_content.user_formatted (depth-tracked with html.parser)
import sys, re, collections
from html.parser import HTMLParser
VOID = {'img', 'br', 'hr', 'input', 'meta', 'link', 'source', 'wbr', 'col', 'area', 'base', 'embed', 'param', 'track'}
T = collections.Counter(); C = collections.Counter(); A = collections.Counter(); IF = collections.Counter(); ST = collections.Counter()
links = collections.Counter(); imgs = collections.Counter(); wrapdepth = collections.Counter()
class P(HTMLParser):
    def __init__(s): super().__init__(); s.depth = 0; s.inside = None
    def handle_starttag(s, t, a):
        d = dict(a)
        if d.get('id') == 'wrapper': wrapdepth[s.depth] += 1
        cls = (d.get('class') or '').split()
        if s.inside is None and t == 'div' and 'jam_content' in cls and 'user_formatted' in cls:
            s.inside = s.depth
        elif s.inside is not None:
            T[t] += 1
            for c in cls: C[c if not c.startswith('custom') else ('custom-*' if c.startswith('custom-') else 'custom_* (' + c + ')')] += 1
            for k in d:
                if k not in ('href', 'src', 'alt', 'title', 'class'): A[t + '@' + k] += 1
            if 'style' in d: ST[re.sub(r'\d+', 'N', d['style'].strip())[:50]] += 1
            if t == 'iframe': IF[re.sub(r'^(https?:)?//([^/]+).*', r'\2', d.get('src') or '')] += 1
            if t == 'a' and d.get('href'):
                off = not re.match(r'^(https?://([\w-]+\.)?itch\.io|/|#|mailto)', d['href'])
                links[('offsite' if off else 'itch/relative', 'rel=' + str(d.get('rel')), 'refpol=' + str(d.get('referrerpolicy')), 'target' if 'target' in d else 'no-target')] += 1
            if t == 'img': imgs['loading=' + str(d.get('loading'))] += 1
        if t not in VOID: s.depth += 1
    def handle_startendtag(s, t, a):
        s.handle_starttag(t, a)
        if t not in VOID: s.depth -= 1
    def handle_endtag(s, t):
        if t in VOID: return
        s.depth -= 1
        pass
for p in sys.argv[1:]:
    h = open(p, encoding='utf8', errors='replace').read()
    x = P(); x.feed(h[:h.find('<div class="jam_content user_formatted"')])  # wrapper depth only
    a = h.find('<div class="jam_content user_formatted"')
    m1 = re.compile(r'<div[^>]*id="entries"').search(h, a); m2 = re.compile(r'<script').search(h, a)
    ends = [m.start() for m in (m1, m2) if m]
    seg = h[a:min(ends)]
    y = P(); y.feed(seg)
sys.stdout.reconfigure(encoding='utf-8')
print('pages', len(sys.argv) - 1, '#wrapper depth (html=0, body=1 -> child of body = 2):', dict(wrapdepth))
print('TAGS', T.most_common(40)); print('CLASSES', C.most_common(25)); print('ATTRS', A.most_common(30))
print('IFRAME hosts', dict(IF)); print('STYLE', ST.most_common(12)); print('LINKS'); [print('  ', k, v) for k, v in links.most_common()]
print('IMG', dict(imgs))
