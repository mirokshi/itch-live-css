"""Print a sanitized skeleton (tag#id.classes, no text) of an itch page.
usage: python -I skel.py <file.html> [maxdepth]
Prints: body attrs (page_name), head order (link/style ids), body children,
and the #wrapper subtree down to maxdepth (ids with digits -> N)."""
import sys, re
from html.parser import HTMLParser

VOID = {'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}

class N:
    def __init__(s, tag, attrs, parent):
        s.tag, s.attrs, s.parent, s.kids = tag, dict(attrs), parent, []

class P(HTMLParser):
    def __init__(s):
        super().__init__(convert_charrefs=True)
        s.root = N('#root', [], None); s.cur = s.root
    def handle_starttag(s, tag, attrs):
        n = N(tag, attrs, s.cur); s.cur.kids.append(n)
        if tag not in VOID: s.cur = n
    def handle_startendtag(s, tag, attrs):
        s.cur.kids.append(N(tag, attrs, s.cur))
    def handle_endtag(s, tag):
        c = s.cur
        while c is not None and c.tag != tag: c = c.parent
        if c is not None and c.parent is not None: s.cur = c.parent

def lab(n):
    i = n.attrs.get('id'); c = n.attrs.get('class') or ''
    s = n.tag
    if i: s += '#' + re.sub(r'\d+', 'N', i)
    if c.strip(): s += '.' + '.'.join(c.split())
    extra = []
    for a in ('data-page_name', 'alt', 'src', 'href', 'rel', 'tabindex', 'data-iframe'):
        if a in n.attrs:
            v = n.attrs[a]
            if a in ('src', 'href', 'data-iframe'): v = '<set>' if v else '<empty>'
            elif a == 'alt': v = '<nonempty>' if v else '<empty>'
            extra.append(f'{a}={v}')
    if extra: s += '[' + ' '.join(extra) + ']'
    return s

def walk(n, d, maxd, out):
    if n.tag in ('script', 'svg', 'path'): return
    out.append('  ' * d + lab(n))
    if d >= maxd: return
    prev = None; cnt = 0; buf = []
    kids = [k for k in n.kids if k.tag not in ('script', 'svg', 'path')]
    i = 0
    while i < len(kids):
        k = kids[i]; j = i
        while j + 1 < len(kids) and lab(kids[j+1]) == lab(k) and len(kids) > 6: j += 1
        if j > i:
            out.append('  ' * (d+1) + f'{lab(k)} (x{j-i+1})')
            walk_sub = []
            for kk in k.kids:
                walk(kk, d+2, maxd, walk_sub)
            out.extend(walk_sub)
        else:
            walk(k, d+1, maxd, out)
        i = j + 1

def find(n, pred):
    if pred(n): return n
    for k in n.kids:
        r = find(k, pred)
        if r: return r

def main():
    f = sys.argv[1]; maxd = int(sys.argv[2]) if len(sys.argv) > 2 else 6
    p = P(); p.feed(open(f, encoding='utf-8', errors='replace').read())
    body = find(p.root, lambda n: n.tag == 'body')
    head = find(p.root, lambda n: n.tag == 'head')
    html = find(p.root, lambda n: n.tag == 'html')
    print('html lang =', html.attrs.get('lang') if html else None)
    if body:
        print('body page_name =', body.attrs.get('data-page_name'), '| classes =', sorted((body.attrs.get('class') or '').split()))
    if head:
        print('HEAD order:')
        for k in head.kids:
            if k.tag == 'link' and 'stylesheet' in (k.attrs.get('rel') or ''):
                print('  link', re.sub(r'\?.*', '?…', k.attrs.get('href', '')))
            elif k.tag == 'style':
                print('  style#' + str(k.attrs.get('id')))
    if body:
        print('BODY children:')
        for k in body.kids:
            if k.tag != 'script': print('  ' + lab(k))
    w = find(p.root, lambda n: n.attrs.get('id') == 'wrapper')
    print('WRAPPER:' if w else 'NO #wrapper')
    if w:
        out = []; walk(w, 0, maxd, out); print('\n'.join(out))

main()
