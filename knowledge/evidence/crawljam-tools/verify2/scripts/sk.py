# usage: python -I sk.py <html> <start-css-class-or-id> <maxdepth>  -> sanitized skeleton (tag#id.classes, digits->N), no text
import sys, re
from html.parser import HTMLParser
VOID = {'img', 'br', 'hr', 'input', 'meta', 'link', 'source', 'wbr', 'col', 'area', 'base', 'embed', 'param', 'track'}
SKIPKIDS = {'svg', 'script', 'template'}
src, start, maxd = sys.argv[1], sys.argv[2], int(sys.argv[3])
class P(HTMLParser):
    def __init__(s):
        super().__init__(); s.stack = []; s.on = None; s.done = False; s.lines = []; s.seen = {}
    def handle_starttag(s, t, a):
        d = dict(a)
        cls = (d.get('class') or '').split(); i = d.get('id')
        if s.done: 
            if t not in VOID: s.stack.append(t)
            return
        if s.on is None and (start in cls or i == start):
            s.on = len(s.stack)
        if s.on is not None:
            depth = len(s.stack) - s.on
            skip = any(x in SKIPKIDS for x in s.stack[s.on:])
            if depth <= maxd and not skip:
                lab = t + ('#' + re.sub(r'\d+', 'N', i) if i else '') + ''.join('.' + c for c in cls)
                extra = ''.join(f'[{k}={v}]' for k, v in a if k in ('data-name',))
                key = (depth, lab + extra, tuple(s.stack[-1:]))
                s.seen[key] = s.seen.get(key, 0) + 1
                if s.seen[key] <= 2:
                    s.lines.append('  ' * depth + lab + extra + ('  (x more)' if s.seen[key] == 2 else ''))
        if t not in VOID: s.stack.append(t)
    def handle_endtag(s, t):
        if t in VOID: return
        while s.stack:
            x = s.stack.pop()
            if s.on is not None and not s.done and len(s.stack) < s.on: s.done = True
            if x == t: break
    def handle_startendtag(s, t, a):
        s.handle_starttag(t, a)
p = P(); p.feed(open(src, encoding='utf8').read())
sys.stdout.reconfigure(encoding='utf-8'); print('\n'.join(p.lines))
