"""Tiny CSS parser for analysis (handles comments, strings, nested blocks).
Produces a flat list of rules: dict(ctx=[at-rule preludes], sel=str, decls=[(prop,val,important)])
Nested style rules (CSS nesting) are flattened with an implicit/explicit '&' parent marker.
"""
import re

def strip_comments(s):
    out = []
    i = 0
    n = len(s)
    while i < n:
        c = s[i]
        if c in '"\'':
            j = i + 1
            while j < n and s[j] != c:
                if s[j] == '\\':
                    j += 1
                j += 1
            out.append(s[i:j+1]); i = j + 1
        elif s.startswith('/*', i):
            j = s.find('*/', i + 2)
            i = n if j < 0 else j + 2
        else:
            out.append(c); i += 1
    return ''.join(out)

def _split_top(body):
    """Split a block body into items: ('decl', text) or ('block', prelude, inner)."""
    items = []
    i = 0; n = len(body); start = 0
    while i < n:
        c = body[i]
        if c in '"\'':
            j = i + 1
            while j < n and body[j] != c:
                if body[j] == '\\': j += 1
                j += 1
            i = j + 1; continue
        if c == '(':
            depth = 1; j = i + 1
            while j < n and depth:
                if body[j] == '(': depth += 1
                elif body[j] == ')': depth -= 1
                elif body[j] in '"\'':
                    q = body[j]; j += 1
                    while j < n and body[j] != q:
                        if body[j] == '\\': j += 1
                        j += 1
                j += 1
            i = j; continue
        if c == ';':
            t = body[start:i].strip()
            if t: items.append(('decl', t))
            start = i + 1; i += 1; continue
        if c == '{':
            prelude = body[start:i].strip()
            depth = 1; j = i + 1
            while j < n and depth:
                if body[j] in '"\'':
                    q = body[j]; j += 1
                    while j < n and body[j] != q:
                        if body[j] == '\\': j += 1
                        j += 1
                    j += 1; continue
                if body[j] == '{': depth += 1
                elif body[j] == '}': depth -= 1
                j += 1
            items.append(('block', prelude, body[i+1:j-1]))
            start = j; i = j; continue
        i += 1
    t = body[start:].strip()
    if t: items.append(('decl', t))
    return items

def _parse_decl(t):
    if ':' not in t: return None
    p, v = t.split(':', 1)
    p = p.strip(); v = v.strip()
    imp = False
    m = re.search(r'!\s*important\s*$', v, re.I)
    if m:
        imp = True; v = v[:m.start()].strip()
    return (p, v, imp)

def split_selectors(sel):
    parts = []; depth = 0; cur = ''
    for ch in sel:
        if ch in '([': depth += 1
        elif ch in ')]': depth -= 1
        if ch == ',' and depth == 0:
            parts.append(cur.strip()); cur = ''
        else:
            cur += ch
    if cur.strip(): parts.append(cur.strip())
    return parts

def _combine(parent, child):
    if parent is None: return child
    ps = split_selectors(parent); cs = split_selectors(child)
    out = []
    for c in cs:
        for p in ps:
            if '&' in c: out.append(c.replace('&', p))
            else: out.append(p + ' ' + c)
    return ', '.join(out)

def parse(css, ctx=None, parent_sel=None, out=None, nested_flag=False):
    if out is None: out = []
    if ctx is None: ctx = []
    items = _split_top(css)
    decls = []
    for it in items:
        if it[0] == 'decl':
            if it[1].startswith('@'):
                out.append({'ctx': ctx, 'sel': None, 'atrule': it[1], 'decls': []})
                continue
            d = _parse_decl(it[1])
            if d: decls.append(d)
        else:
            prelude, inner = it[1], it[2]
            if prelude.startswith('@'):
                name = prelude.split()[0].lower() if prelude.split() else prelude
                if name in ('@media', '@supports', '@container', '@layer', '@document', '@-moz-document', '@scope', '@starting-style'):
                    parse(inner, ctx + [prelude], parent_sel, out, nested_flag)
                else:
                    # @keyframes, @font-face, @page, @property ...
                    sub = _split_top(inner)
                    ds = [_parse_decl(x[1]) for x in sub if x[0] == 'decl']
                    out.append({'ctx': ctx, 'sel': None, 'atrule': prelude, 'decls': [d for d in ds if d], 'raw': inner})
            else:
                sel = _combine(parent_sel, prelude)
                parse(inner, ctx, sel, out, nested_flag or parent_sel is not None)
    if decls and parent_sel is not None:
        out.append({'ctx': ctx, 'sel': parent_sel, 'decls': decls, 'nested': nested_flag})
    return out

# ---------- specificity ----------
def _strip_strings(s):
    return re.sub(r'"[^"]*"|\'[^\']*\'', '""', s)

def specificity(sel):
    s = _strip_strings(sel)
    a = b = c = 0
    # handle :is/:not/:has (max of args) and :where (0)
    def handle_fn(s):
        nonlocal a, b, c
        while True:
            m = re.search(r':(is|not|has|where|matches|-webkit-any|-moz-any)\(', s)
            if not m: return s
            start = m.end(); depth = 1; j = start
            while j < len(s) and depth:
                if s[j] == '(': depth += 1
                elif s[j] == ')': depth -= 1
                j += 1
            inner = s[start:j-1]
            if m.group(1) != 'where':
                best = (0, 0, 0)
                for part in split_selectors(inner):
                    sp = specificity(part)
                    if sp > best: best = sp
                a += best[0]; b += best[1]; c += best[2]
            s = s[:m.start()] + ' ' + s[j:]
    s = handle_fn(s)
    # other functional pseudo-classes like :nth-child(...) - drop args
    s = re.sub(r'(:[\w-]+)\([^)]*\)', r'\1', s)
    a += len(re.findall(r'#[\w-]+', s))
    b += len(re.findall(r'\.[\w-]+', s))
    b += len(re.findall(r'\[[^\]]*\]', s))
    pe = re.findall(r'::[\w-]+', s)
    s2 = re.sub(r'::[\w-]+', '', s)
    legacy_pe = re.findall(r':(before|after|first-line|first-letter)\b', s2)
    s2 = re.sub(r':(before|after|first-line|first-letter)\b', '', s2)
    b += len(re.findall(r':[\w-]+', s2))
    c += len(pe) + len(legacy_pe)
    s3 = re.sub(r'#[\w-]+|\.[\w-]+|\[[^\]]*\]|::?[\w-]+', ' ', s2)
    c += len([t for t in re.findall(r'(?:^|[\s>+~(])([a-zA-Z][\w-]*)', s3) if t])
    return (a, b, c)

if __name__ == '__main__':
    tests = ['#wrapper .game_cell', '.user_page a', '.game_grid_widget .game_cell .game_title a.title', 'a:hover', ':is(#a, .b) p', ':where(#a) p', 'li::before', '.a:not(.b)']
    for t in tests: print(t, specificity(t))
