"""Independent tiny CSS parser + specificity (verifier's own tool, not the first agent's).
parse(text) -> list of items; item = ('decl', text) | ('rule', prelude, items) | ('at', prelude, items|None)
walk(items) yields (context_list, kind, prelude_resolved, decls, important_decls) for style rules, with nesting resolved.
"""
import re

def strip_comments(s):
    out, i, n = [], 0, len(s)
    q = None
    while i < n:
        c = s[i]
        if q:
            out.append(c)
            if c == '\\' and i + 1 < n:
                out.append(s[i + 1]); i += 2; continue
            if c == q: q = None
            i += 1; continue
        if c in '"\'':
            q = c; out.append(c); i += 1; continue
        if c == '/' and s.startswith('/*', i):
            j = s.find('*/', i + 2)
            i = n if j < 0 else j + 2
            continue
        out.append(c); i += 1
    return ''.join(out)

def parse(s, top=True):
    if top: s = strip_comments(s)
    items, buf, i, n = [], [], 0, len(s)
    q = None; depth_paren = 0
    while i < n:
        c = s[i]
        if q:
            buf.append(c)
            if c == '\\' and i + 1 < n: buf.append(s[i + 1]); i += 2; continue
            if c == q: q = None
            i += 1; continue
        if c in '"\'': q = c; buf.append(c); i += 1; continue
        if c == '(': depth_paren += 1
        elif c == ')': depth_paren -= 1
        if c == ';' and depth_paren == 0:
            t = ''.join(buf).strip(); buf = []
            if t: items.append(('at', t, None) if t.startswith('@') else ('decl', t))
            i += 1; continue
        if c == '{' and depth_paren == 0:
            # find matching brace
            d, j, qq = 1, i + 1, None
            while j < n and d:
                cj = s[j]
                if qq:
                    if cj == '\\': j += 2; continue
                    if cj == qq: qq = None
                elif cj in '"\'': qq = cj
                elif cj == '{': d += 1
                elif cj == '}': d -= 1
                j += 1
            inner = s[i + 1:j - 1]
            pre = ' '.join(''.join(buf).split()); buf = []
            if pre.startswith('@'):
                name = pre.split()[0].lower()
                if name in ('@media', '@supports', '@layer', '@container', '@document', '@scope'):
                    items.append(('at', pre, parse(inner, False)))
                else:  # @font-face, @keyframes, @page ... keep raw
                    items.append(('atraw', pre, inner))
            else:
                items.append(('rule', pre, parse(inner, False)))
            i = j; continue
        buf.append(c); i += 1
    t = ''.join(buf).strip()
    if t: items.append(('at', t, None) if t.startswith('@') else ('decl', t))
    return items

def split_top(sel, sep=','):
    parts, buf, d, q = [], [], 0, None
    for c in sel:
        if q:
            buf.append(c)
            if c == q: q = None
            continue
        if c in '"\'': q = c
        elif c in '([': d += 1
        elif c in ')]': d -= 1
        if c == sep and d == 0:
            parts.append(''.join(buf).strip()); buf = []; continue
        buf.append(c)
    parts.append(''.join(buf).strip())
    return [p for p in parts if p]

LEGACY_PE = {'before', 'after', 'first-line', 'first-letter'}

def spec(sel):
    """specificity tuple of one complex selector"""
    a = b = c = 0
    i, n = 0, len(sel)
    while i < n:
        ch = sel[i]
        if ch == '#':
            m = re.match(r'#[-\w]+', sel[i:]); a += 1; i += len(m.group(0)); continue
        if ch == '.':
            m = re.match(r'\.[-\w]+', sel[i:]); b += 1; i += len(m.group(0)); continue
        if ch == '[':
            j = i; d = 0
            while j < n:
                if sel[j] == '[': d += 1
                elif sel[j] == ']':
                    d -= 1
                    if d == 0: break
                j += 1
            b += 1; i = j + 1; continue
        if ch == ':':
            if sel.startswith('::', i):
                m = re.match(r'::[-\w]+', sel[i:]); c += 1; i += len(m.group(0))
                if i < n and sel[i] == '(':  # ::part(), ::slotted()
                    j = match_paren(sel, i); i = j + 1
                continue
            m = re.match(r':([-\w]+)', sel[i:]); name = m.group(1).lower(); i += len(m.group(0))
            arg = None
            if i < n and sel[i] == '(':
                j = match_paren(sel, i); arg = sel[i + 1:j]; i = j + 1
            if name in LEGACY_PE: c += 1
            elif name == 'where': pass
            elif name in ('not', 'is', 'has', 'matches', '-webkit-any', '-moz-any'):
                best = max((spec(x) for x in split_top(arg)), default=(0, 0, 0))
                a += best[0]; b += best[1]; c += best[2]
            elif name in ('nth-child', 'nth-last-child') and arg and ' of ' in arg:
                best = max((spec(x) for x in split_top(arg.split(' of ', 1)[1])), default=(0, 0, 0))
                a += best[0]; b += best[1] + 1; c += best[2]
            else: b += 1
            continue
        if ch == '*' or ch == '&': i += 1; continue
        m = re.match(r'[a-zA-Z][-\w]*', sel[i:])
        if m and (i == 0 or sel[i - 1] in ' >+~(|'):
            c += 1; i += len(m.group(0)); continue
        i += 1
    return (a, b, c)

def match_paren(s, i):
    d = 0
    for j in range(i, len(s)):
        if s[j] == '(': d += 1
        elif s[j] == ')':
            d -= 1
            if d == 0: return j
    return len(s) - 1

def resolve(parent_sels, sel):
    if not parent_sels: return sel
    if '&' in sel:
        return [sel.replace('&', p) for p in parent_sels]
    return [p + ' ' + sel for p in parent_sels]

def walk(items, ctx=(), parents=None, nested=False):
    """yield dict(ctx, selectors(list of resolved), decls, nested)"""
    for it in items:
        if it[0] == 'rule':
            sels = split_top(it[1])
            if parents:
                res = []
                for s in sels:
                    r = resolve(parents, s)
                    res.extend(r if isinstance(r, list) else [r])
                sels = res
            decls = [x[1] for x in it[2] if x[0] == 'decl']
            yield dict(ctx=ctx, selectors=sels, decls=decls, nested=nested)
            yield from walk(it[2], ctx, sels, True)
        elif it[0] == 'at' and it[2] is not None:
            yield from walk(it[2], ctx + (it[1],), parents, nested)
