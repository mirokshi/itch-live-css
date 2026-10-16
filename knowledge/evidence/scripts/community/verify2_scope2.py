"""Independent recount: how many style-rule selectors in a CSS file are scoped under #wrapper.
Usage: python -I -X utf8 scope2.py file.css [...]
Counts complex selectors (comma-separated) of style rules at any nesting level outside of
@keyframes/@font-face; a nested selector counts as scoped if any ancestor rule is scoped.
"""
import re, sys, os
SCOPE = tuple(os.environ.get('SCOPE', '#wrapper').split('|'))

def strip_comments(s):
    return re.sub(r'/\*.*?\*/', '', s, flags=re.S)

def walk(css):
    # tokenise into prelude{ ... } blocks with a simple stack
    out = []  # (selector, scoped)
    stack = []  # (kind, scoped)
    buf = ''
    i = 0
    in_str = None
    while i < len(css):
        c = css[i]
        if in_str:
            buf += c
            if c == in_str and css[i-1] != '\\':
                in_str = None
        elif c in '"\'':
            in_str = c; buf += c
        elif c == '{':
            pre = buf.strip(); buf = ''
            parent_scoped = any(s for k, s in stack if k == 'rule')
            if pre.startswith('@'):
                kind = 'skip' if re.match(r'@(-\w+-)?(keyframes|font-face|property|counter-style|page)', pre) else 'at'
                stack.append((kind, parent_scoped))
            else:
                if any(k == 'skip' for k, _ in stack):
                    stack.append(('skip', False))
                else:
                    sels = [x.strip() for x in pre.split(',') if x.strip()]
                    scoped_any = False
                    for s in sels:
                        sc = parent_scoped or s.startswith(SCOPE)
                        out.append((s, sc)); scoped_any |= sc
                    stack.append(('rule', scoped_any and all(parent_scoped or s.startswith(SCOPE) for s in sels)))
        elif c == '}':
            buf = ''
            if stack: stack.pop()
        elif c == ';':
            buf = ''
        else:
            buf += c
        i += 1
    return out

for p in sys.argv[1:]:
    raw = open(p, encoding='utf-8', errors='replace').read()
    css = strip_comments(raw)
    sels = walk(css)
    n = len(sels); sc = sum(1 for _, s in sels if s)
    glob = sorted({s for s, ok in sels if not ok and re.match(r'(html|body|:root|\*|\.footer|\.header\b|#user_tools)', s)})
    print(f'{p.split("/")[-1]:22} chars={len(raw):6} selectors={n:4} under#wrapper={sc:4} ({(100*sc/n if n else 0):3.0f}%) '
          f'!important={len(re.findall(r"!\s*important", css)):3} global={glob[:6]}')
